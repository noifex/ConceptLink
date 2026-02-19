# ConceptLink Backend - Issues Fixed & Login System

**Date**: 2026-02-12
**Version**: Spring Boot 4.0.1

---

## 📋 Table of Contents

1. [Issues Fixed](#issues-fixed)
2. [New Login System](#new-login-system)
3. [Force Logout Guide](#force-logout-guide)

---

## Issues Fixed

### Issue 1: Database Connection Failure ❌

**Problem:**
```
Database connection failed - configuration mismatch between files
```

**Root Cause:**
- `application.properties` used: `jdbc:mysql://localhost:3306/multilang_memo` (underscore)
- `application-dev.yml` used: `jdbc:mysql://localhost:3306/multilang-memo` (hyphen)
- Actual database name: `multilang_memo`

**Fix:**
```yaml
# File: src/main/resources/application-dev.yml:9
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/multilang_memo  # Changed hyphen to underscore
    username: root
    password: password
```

**Status:** ✅ Fixed

---

### Issue 2: Concept Creation Failed ❌

**Problem:**
```json
{
  "error": "could not execute statement",
  "message": "NOT NULL constraint failed: concept.user_id"
}
```

**Root Cause:**
- Database schema has `user_id` column (NOT NULL)
- Concept entity was missing `userId` field mapping
- Controller only set `username`, not `user_id`

**Fix:**

**File: `src/main/java/com/multilang/memo/entity/Concept.java:17-18`**
```java
@Entity
@Data
@Table(name="concept")
public class Concept {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;  // ✅ Added

    @Column(nullable = false, length = 50)
    private String username;

    private String name;
    private String notes;

    @OneToMany(mappedBy = "concept", cascade = CascadeType.ALL)
    private List<Word> words = new ArrayList<>();
}
```

**File: `src/main/java/com/multilang/memo/controller/ConceptController.java:40-43`**
```java
@PostMapping
public Concept add(@RequestHeader("Authorization") String authHeader, @RequestBody Concept concept) {
    User user = getUserFromToken(authHeader);
    concept.setUserId(user.getId().toString());  // ✅ Added
    concept.setUsername(user.getUsername());
    return conceptRepository.save(concept);
}
```

**Status:** ✅ Fixed

---

### Issue 3: Token Expiration Not Validated ❌

**Problem:**
```
Expired tokens were still accepted by API endpoints
```

**Root Cause:**
- ConceptController extracted user but didn't check token expiration
- Logout expired the token, but API still allowed access

**Fix:**

**File: `src/main/java/com/multilang/memo/controller/ConceptController.java:32-35`**
```java
private User getUserFromToken(String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        throw new RuntimeException("Invalid authorization header");
    }

    String token = authHeader.substring(7);
    User user = userRepository.findByToken(token)
        .orElseThrow(() -> new RuntimeException("Invalid token"));

    // ✅ Check if token is expired
    if (user.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
        throw new RuntimeException("Token expired");
    }

    return user;
}
```

**Status:** ✅ Fixed

---

### Issue 4: Logout Deletes User Account ❌

**Problem:**
```java
// Old logout implementation
@PostMapping("/logout")
public ResponseEntity<?> logout(@RequestBody TokenRequest request) {
    userRepository.findByToken(request.getToken())
        .ifPresent(userRepository::delete);  // ❌ Deletes entire user!
    return ResponseEntity.ok().build();
}
```

**Impact:**
- User account deleted on logout
- All concepts become orphaned (no owner)
- User loses all data
- Cannot re-login with same username

**Fix:**

**File: `src/main/java/com/multilang/memo/controller/AuthController.java:72-82`**
```java
@PostMapping("/logout")
public ResponseEntity<?> logout(@RequestBody TokenRequest request) {
    userRepository.findByToken(request.getToken())
        .ifPresent(user -> {
            // ✅ Expire the token immediately instead of deleting the user
            user.setExpiresAt(LocalDateTime.now().minusDays(1));
            userRepository.save(user);
        });

    return ResponseEntity.ok().build();
}
```

**Benefits:**
- ✅ User account preserved
- ✅ All concepts and words retained
- ✅ Can re-login with same username
- ✅ Token becomes invalid immediately

**Status:** ✅ Fixed

---

### Issue 5: Cannot Re-login After Logout ❌

**Problem:**
```
After logout, trying to login again returns:
"このユーザー名は既に使用されています" (This username is already in use)
```

**Root Cause:**
- Logout only expires token but keeps user account
- Register endpoint checks `existsByUsername()` and rejects
- User cannot re-login with same username

**Fix:**

**File: `src/main/java/com/multilang/memo/controller/AuthController.java:35-51`**
```java
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    String username = request.getUsername().trim();

    // Validation...

    // ✅ Check if username already exists
    User existingUser = userRepository.findByUsername(username).orElse(null);

    if (existingUser != null) {
        // User exists - check if token is expired
        if (existingUser.getExpiresAt().isAfter(LocalDateTime.now())) {
            // Token still valid - user already logged in
            return ResponseEntity.badRequest().body("このユーザー名は既に使用されています");
        }

        // ✅ Token expired - reactivate the account with new token
        existingUser.setToken(UUID.randomUUID().toString());
        existingUser.setExpiresAt(LocalDateTime.now().plusDays(365));
        userRepository.save(existingUser);

        return ResponseEntity.ok(new AuthResponse(existingUser.getUsername(), existingUser.getToken()));
    }

    // Create new user...
}
```

**Status:** ✅ Fixed

---

### Issue 6: Database Column Size Too Small ❌

**Problem:**
```
Data truncation: Data too long for column 'notes' at row 1
```

**Root Cause:**
- `notes` column was `VARCHAR(255)` - too small for markdown content
- Concepts with detailed notes failed to save

**Fix:**
```sql
ALTER TABLE concept MODIFY COLUMN notes TEXT;
```

**Status:** ✅ Fixed

---

## New Login System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Login Flow                           │
└─────────────────────────────────────────────────────────┘

1. User enters username
   ↓
2. POST /api/auth/register
   ↓
3. Check if username exists
   ├─ No  → Create new user + token
   │        └─ Return token
   │
   └─ Yes → Check token expiration
             ├─ Valid   → Error: "Already in use"
             └─ Expired → Generate new token
                          └─ Return token

4. Frontend stores token
   ↓
5. All API calls include: Authorization: Bearer {token}
   ↓
6. Backend validates token + expiration
   └─ Valid   → Process request
   └─ Expired → Error: "Token expired"
```

### Token Lifecycle

| State | Expires At | Can Login? | Can Access API? |
|-------|-----------|------------|-----------------|
| **New User** | Now + 365 days | N/A | ✅ Yes |
| **Active Session** | Now + 365 days | ❌ Error | ✅ Yes |
| **After Logout** | Now - 1 day | ✅ Re-login | ❌ No |

### Key Features

1. **Token-Based Authentication**
   - No passwords required
   - UUID tokens (128-bit random)
   - 365-day expiration

2. **Automatic Re-login**
   - Can re-use same username after logout
   - New token issued automatically
   - All data preserved

3. **Data Preservation**
   - Concepts remain linked to user
   - Words stay connected to concepts
   - No data loss on logout

---

## Force Logout Guide

### Method 1: API Logout (Recommended)

**From Frontend:**
```javascript
const logout = async () => {
  const token = localStorage.getItem('authToken');

  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
};
```

**Result:**
- ✅ Token expired immediately
- ✅ User account preserved
- ✅ All data intact
- ✅ Can re-login

---

### Method 2: Database Token Expiration (Admin)

**Expire specific user's token:**
```sql
UPDATE users
SET expires_at = NOW() - INTERVAL 1 DAY
WHERE username = 'Creator';
```

**Expire all tokens (force logout everyone):**
```sql
UPDATE users
SET expires_at = NOW() - INTERVAL 1 DAY;
```

**Result:**
- ✅ All tokens expired
- ✅ Users must re-login
- ✅ All data preserved

---

### Method 3: Delete User Account (Nuclear Option)

⚠️ **WARNING: This deletes user and orphans all data!**

**Delete specific user:**
```sql
DELETE FROM users WHERE username = 'Creator';
```

**Result:**
- ❌ User account deleted
- ⚠️ Concepts become orphaned (user_id points to non-existent user)
- ⚠️ Cannot access data without manual reassignment
- ❌ Username cannot be reused (concepts still reference it)

**When to use:**
- Permanently removing a user
- Clean start needed
- Testing purposes

**Data Recovery:**
```sql
-- Create new user with same username
INSERT INTO users (username, token, created_at, expires_at)
VALUES ('Creator', UUID(), NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY));

-- Reassign orphaned concepts
UPDATE concept
SET user_id = (SELECT id FROM users WHERE username = 'Creator')
WHERE username = 'Creator';
```

---

### Method 4: Database Reset (Complete Clean)

**Reset entire database:**
```sql
-- WARNING: Deletes ALL data!
DELETE FROM words;
DELETE FROM concept;
DELETE FROM users;
```

**Or with Docker:**
```bash
# Stop containers
docker-compose down

# Delete volume
docker volume rm conceptlink_mysql-data

# Restart
docker-compose up -d
```

---

## Comparison: Logout Methods

| Method | Speed | Data Safe? | Reversible? | Use Case |
|--------|-------|------------|-------------|----------|
| **API Logout** | Instant | ✅ Yes | ✅ Re-login | Normal logout |
| **Expire Token** | Instant | ✅ Yes | ✅ Re-login | Admin force logout |
| **Delete User** | Instant | ⚠️ Orphaned | ⚠️ Manual fix | Remove user permanently |
| **Reset DB** | 10-30s | ❌ Lost | ❌ No | Development/testing |

---

## Best Practices

### For Users:
1. ✅ Always use the logout button in the app
2. ✅ Re-login with same username to access your data
3. ❌ Don't share your token with others

### For Admins:
1. ✅ Use Method 1 or 2 for force logout
2. ⚠️ Use Method 3 only when permanently removing a user
3. ❌ Never use Method 4 in production

### For Developers:
1. ✅ Always expire tokens, don't delete users
2. ✅ Preserve user_id and username in concepts
3. ✅ Validate token expiration in all protected endpoints
4. ✅ Return clear error messages for expired tokens

---

## Testing the System

### Test 1: Normal Login/Logout Cycle
```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "TestUser"}'
# Response: {"username":"TestUser","token":"abc-123"}

# 2. Access API (works)
curl -X GET http://localhost:8080/api/concepts \
  -H "Authorization: Bearer abc-123"

# 3. Logout
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"token": "abc-123"}'

# 4. Access API (fails - token expired)
curl -X GET http://localhost:8080/api/concepts \
  -H "Authorization: Bearer abc-123"
# Response: {"message":"Token expired"}

# 5. Re-login (works - gets new token)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "TestUser"}'
# Response: {"username":"TestUser","token":"xyz-789"}
```

### Test 2: Double Login Prevention
```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "TestUser"}'
# Response: {"username":"TestUser","token":"abc-123"}

# 2. Try to login again (fails)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "TestUser"}'
# Response: "このユーザー名は既に使用されています"
```

### Test 3: Force Logout via Database
```bash
# 1. Login normally
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "TestUser"}'

# 2. Force expire token (admin)
docker exec mysql-multilang mysql -u root -ppassword multilang_memo \
  -e "UPDATE users SET expires_at = NOW() - INTERVAL 1 DAY WHERE username = 'TestUser';"

# 3. Try to access API (fails)
curl -X GET http://localhost:8080/api/concepts \
  -H "Authorization: Bearer abc-123"
# Response: {"message":"Token expired"}

# 4. Re-login (works)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "TestUser"}'
# Response: {"username":"TestUser","token":"new-token-456"}
```

---

## Summary

### Issues Fixed: 6/6 ✅

1. ✅ Database connection mismatch
2. ✅ Concept creation missing user_id
3. ✅ Token expiration not validated
4. ✅ Logout deletes user account
5. ✅ Cannot re-login after logout
6. ✅ Database column size too small

### New Features: ✅

- Token-based authentication
- Automatic re-login after logout
- Data preservation on logout
- Multiple force logout methods
- Token expiration validation
- Double login prevention

### Security: ✅

- All API endpoints validate token expiration
- Expired tokens rejected immediately
- No password storage
- UUID-based tokens (secure random)

---

## Contact & Support

**Repository**: ConceptLink
**Backend**: Spring Boot 4.0.1
**Database**: MySQL 8.0.44
**Documentation Date**: 2026-02-12

For issues or questions, please refer to this document or check the codebase comments.
