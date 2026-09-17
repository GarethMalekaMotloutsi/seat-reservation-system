# Seat Reservation System

A simple seat reservation system built with Node.js and Express.

The system allows users to place temporary holds on seats, confirm or release their holds, extend a hold, and join a waitlist when all seats are taken. It also keeps an event log of reservation activity.

## Requirements

- Node.js
- npm

## Installation

Clone the repository and install the dependencies:

    npm install

## Running the Project

Start the server with:

    npm start

The application will run at:

    http://localhost:3000

The frontend is served from the same Express server.

For development, nodemon can also be used:

    npm run dev

## Running Tests

Run the automated tests with:

    npm test

The tests cover the main reservation rules, including:

- Hold code format
- Hold code uniqueness
- Hold expiry
- Maximum active holds
- Maximum holds per hour
- Confirmation idempotency
- Waitlist promotion

## Configuration

The reservation settings can be changed in:

    src/config.js

The current settings include:

- Number of seats: 20
- Hold duration: 60 seconds
- Maximum active holds per user: 2
- Maximum holds per hour: 5
- Maximum extensions per hold: 2

Changing these values allows the system rules to be adjusted without changing the main reservation logic.

## Main Features

### Seat Holds

Users can select an available seat and place a temporary hold using their email address.

Each hold receives a 6-character uppercase code.

### Hold Expiry

A hold automatically expires after the configured hold duration if it has not been confirmed.

The server checks for expired holds every few seconds.

### Confirmation

A user can confirm a hold using their email address and hold code.

Confirming the same hold again does not create another confirmation event.

### Hold Extension

An active hold can be extended up to the configured extension limit.

Each extension gives the hold another full hold period.

### Release

A user can release an active hold or confirmed reservation using their email and hold code.

The seat then becomes available again.

### Waitlist

When all seats are taken, users can join the waitlist.

The waitlist follows a first-in-first-out order. When a seat becomes available, the first person on the waitlist is automatically given a temporary hold.

### Event Log

The system records important reservation events such as:

- Hold placed
- Hold extended
- Hold confirmed
- Hold released
- Hold expired
- Waitlist joined
- Waitlist promoted

The event log can also be filtered by seat number.

## API Endpoints

### Seats

    GET /api/seats

Returns the current state of all seats.

### Place Hold

    POST /api/holds

Places a temporary hold on an available seat.

### Confirm Hold

    POST /api/holds/confirm

Confirms an existing hold.

### Extend Hold

    POST /api/holds/extend

Extends an active hold.

### Release Hold

    POST /api/holds/release

Releases a hold or confirmed reservation.

### Join Waitlist

    POST /api/waitlist

Adds a user to the waitlist when all seats are taken.

### Event Log

    GET /api/events

Returns the reservation event log.

Events can be filtered by seat:

    GET /api/events?seatNumber=1

## Concurrency

The current version uses in-memory state and runs the reservation changes inside the Node.js process.

When a seat is being held, the seat is checked and updated as part of the same synchronous operation. This means another request handled by the same Node.js process will see that the seat is no longer available.

For a multi-server version, the reservation state would need to be moved to a shared database with a transaction or locking mechanism to prevent two servers from reserving the same seat.

## Storage

The current system uses in-memory storage for seats, holds, waitlist entries and events.

This keeps the project simple and makes it possible to replace the storage layer with a database later without changing the main reservation rules.

## Frontend

The frontend has three main sections:

- Seat Map
- Manage Hold
- Event Log

The seat map automatically refreshes so that changes such as hold expiry and waitlist promotion are reflected without manually refreshing the page.

## Documentation and References

The following documentation was useful for understanding the technologies and features used in the project:

- Node.js Documentation
- Node.js Test Runner Documentation
- Express.js Documentation
- Express.js Routing Documentation
- Express.js Middleware Documentation
- MDN Web Docs - Fetch API
- MDN Web Docs - setInterval()
- Node.js Crypto Documentation
- npm Documentation