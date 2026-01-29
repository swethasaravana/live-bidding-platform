const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const INITIAL_DURATION = 2 * 60 * 1000; // 2 minutes
const RESET_DURATION = 1 * 60 * 1000; // 1 minute after each bid

function createItems() {
  return [
    {
      id: 1,
      title: "iPhone 15",
      startingPrice: 500,
      currentBid: 500,
      endTime: Date.now() + INITIAL_DURATION,
      highestBidder: null,
      ended: false,
    },
    {
      id: 2,
      title: "MacBook Air",
      startingPrice: 800,
      currentBid: 800,
      endTime: Date.now() + INITIAL_DURATION,
      highestBidder: null,
      ended: false,
    },
    {
      id: 3,
      title: "Samsung S24",
      startingPrice: 400,
      currentBid: 400,
      endTime: Date.now() + INITIAL_DURATION,
      highestBidder: null,
      ended: false,
    },
  ];
}

let items = createItems();
let bidLocks = {};

// When client asks items, restart auctions if all ended
app.get("/items", (req, res) => {
  const allEnded = items.every((item) => item.ended === true);

  if (allEnded) {
    items = createItems(); // restart auction fresh
    console.log("All auctions restarted");
  }

  res.json(items);
});

app.get("/time", (req, res) => res.json({ serverTime: Date.now() }));

// check auction end
setInterval(() => {
  const now = Date.now();
  items.forEach((item) => {
    if (!item.ended && now >= item.endTime) {
      item.ended = true;
      io.emit("AUCTION_ENDED", {
        itemId: item.id,
        winner: item.highestBidder,
        finalBid: item.currentBid,
      });
    }
  });
}, 1000);

// socket
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("BID_PLACED", ({ itemId, bidAmount, userId }) => {
    const item = items.find((i) => i.id === itemId);

    if (!item || item.ended) {
      socket.emit("BID_ERROR", "Auction ended");
      return;
    }

    if (bidLocks[itemId]) {
      socket.emit("BID_ERROR", "Another bid in progress");
      return;
    }

    bidLocks[itemId] = true;

    if (bidAmount <= item.currentBid) {
      bidLocks[itemId] = false;
      socket.emit("BID_ERROR", "Outbid");
      return;
    }

    // accept bid
    item.currentBid = bidAmount;
    item.highestBidder = userId;

    // reset timer on bid
    item.endTime = Date.now() + RESET_DURATION;

    io.emit("UPDATE_BID", item);

    bidLocks[itemId] = false;
  });
});

server.listen(5000, () =>
  console.log("Server running on http://localhost:5000")
);

