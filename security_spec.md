# Security Specification - Facebook Profile Portfolio

This document outlines the security plan, data invariants, and access rules for the Facebook Profile Portfolio Firestore collections.

## 1. Data Invariants & Collection Schema Validation

### Posts Collection (`/posts/{postId}`)
- **Read**: Publicly readable.
- **Create**: Allowed for any participant. Title must be <= 100 characters. Description must be <= 2000 characters. Tags must be an array with size <= 10. `likesCount` must initialize to 0. `likedBy` must be an array of visitor IDs (length <= 1000).
- **Update**: Allowed for incrementing key reactions/likes, or adding visitor ID to `likedBy` arrays. Uses strict action differentiation.
- **Delete**: Prevented or restricted.

### Comments Subcollection (`/posts/{postId}/comments/{commentId}`)
- **Read**: Publicly readable.
- **Create**: Allowed. Author name must be <= 100 characters. Text must be <= 1000 characters.
- **Update/Delete**: Prevented to maintain comment logging.

---

## 2. The "Dirty Dozen" Threat Payloads

Here are twelve payload attacks targeting database state and identity, followed by how we block them.

1. **The ID Poisoning Attack**: Injecting a 1MB string as a postId to exhaust database memory.
   - *Blocked by*: `isValidId(postId)` checks in Firestore rule targets.
2. **The Shadow Field Insertion**: Creating a post containing a hidden `isAdmin: true` field.
   - *Blocked by*: Strict key schema checking on creation: `incoming().keys().hasAll(...) && incoming().keys().size() == N`.
3. **The LikedBy Array Explosion**: Supplying a massive list of 100,000 strings in the `likedBy` field.
   - *Blocked by*: `incoming().likedBy.size() <= 1000` rule constraint.
4. **The Negative Like Counter**: Overwriting a post's `likesCount` to a arbitrary negative integer like `-500`.
   - *Blocked by*: `incoming().likesCount >= 0` check.
5. **The Comment Text Overflow**: Appending a 10MB text wall as a comment text.
   - *Blocked by*: `incoming().text.size() <= 1000` rule constraints.
6. **The Comment Spoofing Attack**: Overwriting someone else's existing comment.
   - *Blocked by*: Restricting comment updates (`allow update: if false;`).
7. **The Arbitrary Field Update**: Trying to change the `title` or `tags` of an existing portfolio post unauthorized.
   - *Blocked by*: `affectedKeys().hasOnly(['likesCount', 'likedBy'])` during normal user interactions.
8. **The Title Length Exhaustion**: Posting a project with a 20,000-character title.
   - *Blocked by*: `incoming().title.size() <= 100`.
9. **The Tag Count Overload**: Submitting a project post with 5,000 tags.
   - *Blocked by*: `incoming().tags.size() <= 10`.
10. **The Temporal Forgery Attack**: Setting `createdAt` to a year in the future.
    - *Blocked by*: Checking `incoming().createdAt == request.time`.
11. **The System-Only Field Mimicry**: Creating comments with custom system statuses.
    - *Blocked by*: Restricting comment properties to exactly `author`, `text`, and `createdAt`.
12. **The Unauthorized Bulk Drop**: Deleting the entire posts collection.
    - *Blocked by*: Denying bulk or individual delete operations unless explicitly authorized.

---

## 3. Rules Structure Plan

The final rules will contain:
- Standalone helper function `isValidId(id)`
- Validation helpers `isValidPost(data)` and `isValidComment(data)`
- Clear conditional logic restricting reads and writes.
