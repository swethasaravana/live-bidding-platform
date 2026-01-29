import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const userId = Math.random().toString(36).substring(7);

function App() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({});
  const [socket, setSocket] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [tick, setTick] = useState(0);
  const [winners, setWinners] = useState({});
  const [flashItem, setFlashItem] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/time")
      .then((res) => res.json())
      .then((data) => {
        const offset = data.serverTime - Date.now();
        setServerOffset(offset);
      });

    fetch("http://localhost:5000/items")
      .then((res) => res.json())
      .then((data) => setItems(data));

    const newSocket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    newSocket.on("UPDATE_BID", (updatedItem) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );

      setFlashItem(updatedItem.id);
      setTimeout(() => setFlashItem(null), 600);

      if (updatedItem.highestBidder === userId) {
        setStatus((prev) => ({ ...prev, [updatedItem.id]: "winning" }));
      } else {
        setStatus((prev) => ({ ...prev, [updatedItem.id]: "outbid" }));
      }
    });

    newSocket.on("AUCTION_ENDED", ({ itemId, winner, finalBid }) => {
      setWinners((prev) => ({
        ...prev,
        [itemId]: { winner, finalBid },
      }));
    });

    newSocket.on("BID_ERROR", (msg) => alert(msg));

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      newSocket.close();
      clearInterval(interval);
    };
  }, []);

  const placeBid = (item) => {
    socket.emit("BID_PLACED", {
      itemId: item.id,
      bidAmount: item.currentBid + 10,
      userId: userId,
    });
  };

  return (
    <div className="container">
      <h1>Live Bidding Platform</h1>

      <div className="grid">
        {items.map((item) => {
          const now = Date.now() + serverOffset;
          const timeLeft = Math.max(
            0,
            Math.floor((item.endTime - now) / 1000)
          );

          const winnerData = winners[item.id];

          return (
            <div
              key={item.id}
              className={`card ${flashItem === item.id ? "flash" : ""}`}
            >
              <h3>{item.title}</h3>
              <p>Current Bid: ${item.currentBid}</p>

              {winnerData ? (
                <>
                  <p style={{ color: "purple" }}>Auction Ended</p>
                  <p style={{ color: "green" }}>
                    Winner: {winnerData.winner || "No bids"} (${winnerData.finalBid})
                  </p>
                </>
              ) : (
                <>
                  <p>Ends in: {timeLeft}s</p>

                  {status[item.id] === "winning" && (
                    <p style={{ color: "green" }}>Winning</p>
                  )}
                  {status[item.id] === "outbid" && (
                    <p style={{ color: "red" }}>Outbid</p>
                  )}

                  <button onClick={() => placeBid(item)}>Bid +$10</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;





