FROM rust:latest as builder

WORKDIR /usr/src/app


RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
COPY api/Cargo.toml api/Cargo.toml
COPY pusher/Cargo.toml pusher/Cargo.toml
COPY worker/Cargo.toml worker/Cargo.toml
COPY store/Cargo.toml store/Cargo.toml

# Create dummy source files to cache dependencies
RUN mkdir -p api/src pusher/src worker/src store/src && \
    echo "fn main() {}" > api/src/main.rs && \
    echo "fn main() {}" > pusher/src/main.rs && \
    echo "fn main() {}" > worker/src/main.rs && \
    echo "" > store/src/lib.rs

# Build dependencies
RUN cargo build --release

# Remove dummy sources
RUN rm -rf api/src pusher/src worker/src store/src

# Copy actual source code
COPY . .

# Touch main files to force rebuild
RUN touch api/src/main.rs pusher/src/main.rs worker/src/main.rs store/src/lib.rs

# Build actual binaries
RUN cargo build --release

# Runtime image
# Runtime image
FROM debian:trixie-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binaries from builder
COPY --from=builder /usr/src/app/target/release/api /app/api
COPY --from=builder /usr/src/app/target/release/pusher /app/pusher
COPY --from=builder /usr/src/app/target/release/worker /app/worker

# Default command (can be overridden)
CMD ["./api"]
