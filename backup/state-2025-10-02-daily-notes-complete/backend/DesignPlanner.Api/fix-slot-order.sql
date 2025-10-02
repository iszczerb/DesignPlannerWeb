-- Fix SlotOrder values for existing assignments
-- This assigns proper SlotOrder values based on CreatedAt within each slot

WITH RankedAssignments AS (
    SELECT
        Id,
        ROW_NUMBER() OVER (
            PARTITION BY EmployeeId, AssignedDate, Slot
            ORDER BY CreatedAt
        ) - 1 AS NewSlotOrder
    FROM Assignments
    WHERE IsActive = 1
)
UPDATE Assignments
SET SlotOrder = (
    SELECT NewSlotOrder
    FROM RankedAssignments
    WHERE RankedAssignments.Id = Assignments.Id
)
WHERE Id IN (SELECT Id FROM RankedAssignments);