import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class Solution {
    public void solve(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement()) {

            // 1. Insert three users: Alice (active), Bob (active), Charlie (inactive)
            // stmt.execute("INSERT INTO users(id, name, email, active) VALUES(...)");

            // 2. Update Alice's email to alice@company.com
            // stmt.execute("UPDATE users SET email = ... WHERE name = 'Alice'");

            // 3. Delete all inactive users
            // stmt.execute("DELETE FROM users WHERE active = FALSE");
        }
    }
}
