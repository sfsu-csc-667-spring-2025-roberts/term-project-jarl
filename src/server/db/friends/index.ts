import pgPromise from "pg-promise";

const SEND_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'pending')`;
const SEND_USERNAME_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, (SELECT user_id FROM users WHERE username = $2), 'pending')`;
const APPROVE_SQL = `UPDATE "userFriends" SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2`;
const DELETE_SQL = `DELETE FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2)`;
const ACCEPT_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'accepted') ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`;
const EXISTING_REQUESTS_SQL = `SELECT * FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`;
const GET_FRIEND_REQUEST_NAME_SQL =
  'SELECT username FROM "users" WHERE user_id = $1 AND friend_id = $2';

class Friends {
  private db: pgPromise.IDatabase<any>;

  constructor(db: pgPromise.IDatabase<any>) {
    this.db = db;
  }

  async sendFriendRequest(userId: number, friendIdentifier: number | string) {
    const isUserId = typeof friendIdentifier === "number";

    const query = isUserId ? SEND_SQL : SEND_USERNAME_SQL;

    return this.db.none(query, [userId, friendIdentifier]);
  }

  async acceptFriendRequest(userId: number, friendId: number) {
    return this.db.none(ACCEPT_SQL, [userId, friendId]);
  }

  async approveFriendRequest(userId: number, friendId: number) {
    return this.db.none(APPROVE_SQL, [userId, friendId]);
  }

  async deleteFriendRequest(userId: number, friendId: number) {
    return this.db.none(DELETE_SQL, [userId, friendId]);
  }

  async existingRequests(userId: number, friendId: number) {
    return this.db.any(EXISTING_REQUESTS_SQL, [userId, friendId]);
  }

  async getFriends(userId: number) {
    return this.db.any(
      `SELECT u.username, uf.friend_id, uf.status
             FROM "userFriends" uf
             JOIN "users" u ON u.user_id = uf.friend_id
             WHERE uf.user_id = $1`,
      [userId],
    );
  }

  async getFriendRequests(userId: number) {
    return this.db.any(
      `SELECT u.username, uf.user_id, uf.status
             FROM "userFriends" uf
             JOIN "users" u ON u.user_id = uf.user_id
             WHERE uf.friend_id = $1 AND uf.status = 'pending'`,
      [userId],
    );
  }

  async getFriendRequestName(userId: number, friendId: number) {
    return this.db.any(GET_FRIEND_REQUEST_NAME_SQL, [userId, friendId]);
  }
}

export default Friends;
