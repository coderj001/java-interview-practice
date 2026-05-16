import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class Solution {
    public void solve(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement()) {
            // 1. Insert three users
            // stmt.execute("INSERT INTO users VALUES (...)");

            // 2. Update alice@example.com -> alice@company.com
            // stmt.execute("UPDATE users SET email = ... WHERE name = 'Alice'");

            // 3. Delete inactive users
            // stmt.execute("DELETE FROM users WHERE active = FALSE");
        }
    }
}
