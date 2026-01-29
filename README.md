# Live Bidding Platform

A real-time auction application where users can place bids on items and see updates instantly.

## ✨ Features
- Real-time bidding using Socket.io
- Live countdown timer synchronized with server time
- Race condition handling (only one bid accepted at a time)
- Visual feedback for bid status (Winning / Outbid)
- Auction ends automatically when timer reaches zero
- Winner is announced when auction ends
- New auction starts automatically after previous one ends

## 🛠 Tech Stack
- Backend: Node.js, Express, Socket.io  
- Frontend: React  
- Deployment: Render (backend), Vercel (frontend)

## 🔄 Workflow
1. Frontend fetches auction items and server time from backend.
2. User places a bid using Socket.io.
3. Backend validates the bid and broadcasts the updated bid to all users.
4. Countdown timer runs based on server time.
5. When timer reaches zero, auction ends and winner is declared.

## 🔗 Vercel URL
https://biddingplatform-black.vercel.app/
