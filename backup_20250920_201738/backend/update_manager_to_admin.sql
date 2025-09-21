-- Update manager user to Admin role (1) instead of Manager role (2)
UPDATE Users
SET Role = 1
WHERE Username = 'manager';

-- Verify the update
SELECT Id, Username, FirstName, LastName, Role
FROM Users
WHERE Username = 'manager';