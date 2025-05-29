using Microsoft.EntityFrameworkCore;
using Vrooom.Data;
using Vrooom.Migrations;
using Vrooom.Models;
using Vrooom.Repos.SupportRepo;

namespace Vrooom.Repos.SupportRepos
{
    public class SupportRepo : ISupportRepo
    {
        private readonly VrooomDbContext _dbcontext;
        private readonly ILogger<SupportRepo> _logger;

        public SupportRepo(VrooomDbContext dbContext, ILogger<SupportRepo> logger)
        {
            _dbcontext = dbContext;
            _logger = logger;
        }

        public async Task addSupport(Support support)
        {
            try
            {
                _logger.LogInformation("💾 Adding support record: ID {SupportId}, User {UserId}, Title: '{Title}'",
                    support.SupportId, support.UserId, support.titlu);

                await _dbcontext.Support.AddAsync(support);
                await _dbcontext.SaveChangesAsync();

                _logger.LogInformation("✅ Support record added successfully to database");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error adding support record to database");
                throw;
            }
        }

        public async Task<IEnumerable<Support>> listSupport()
        {
            try
            {
                _logger.LogInformation("📋 Retrieving all support records from database");

                // FIXED: Don't group by SupportId - return ALL records
                // The grouping was causing replies to be lost!
                var supports = await _dbcontext.Support
                    .OrderBy(x => x.SupportId)
                    .ThenBy(x => x.dummyId) // Use dummyId for chronological order within same SupportId
                    .ToListAsync();

                _logger.LogInformation("📊 Retrieved {Count} total support records from database", supports.Count);

                // Log sample records for debugging
                var groupedCount = supports.GroupBy(s => s.SupportId).Count();
                _logger.LogInformation("🗂️ Records belong to {UniqueTickets} unique support tickets", groupedCount);

                foreach (var group in supports.GroupBy(s => s.SupportId).Take(3))
                {
                    _logger.LogInformation("Sample ticket {SupportId} has {MessageCount} messages",
                        group.Key, group.Count());
                    foreach (var msg in group)
                    {
                        _logger.LogInformation("  - Message from User {UserId}: '{Title}' - {ContentPreview}",
                            msg.UserId, msg.titlu,
                            msg.comentariu.Length > 30 ? msg.comentariu.Substring(0, 30) + "..." : msg.comentariu);
                    }
                }

                return supports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving support records from database");
                throw;
            }
        }

        public async Task<int> getMaxID()
        {
            try
            {
                _logger.LogInformation("🔢 Getting maximum Support ID from database");

                int max = await _dbcontext.Support.MaxAsync(x => x.SupportId);

                _logger.LogInformation("📊 Maximum Support ID: {MaxId}", max);

                return max;
            }
            catch (Exception ex)
            {
                _logger.LogInformation("⚠️ No existing support records, starting from 0");
                return 0;
            }
        }

        public async Task<IEnumerable<Support>> getSupportByUserID(int userId)
        {
            try
            {
                _logger.LogInformation("🔍 Retrieving support records for User {UserId}", userId);

                // FIXED: Don't group by SupportId - return ALL records for this user
                var supports = await _dbcontext.Support
                    .Where(s => s.UserId == userId)
                    .OrderBy(s => s.SupportId)
                    .ThenBy(s => s.dummyId)
                    .ToListAsync();

                _logger.LogInformation("📊 Found {Count} support records for User {UserId}", supports.Count, userId);

                // Log details for debugging
                var groupedCount = supports.GroupBy(s => s.SupportId).Count();
                _logger.LogInformation("🗂️ Records belong to {UniqueTickets} unique tickets for User {UserId}",
                    groupedCount, userId);

                foreach (var group in supports.GroupBy(s => s.SupportId))
                {
                    _logger.LogInformation("User {UserId} ticket {SupportId} has {MessageCount} messages",
                        userId, group.Key, group.Count());
                }

                return supports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving support records for User {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<Support>> getSupportBySupportID(int supportId)
        {
            try
            {
                _logger.LogInformation("🗂️ Retrieving all messages for Support ID {SupportId}", supportId);

                // FIXED: Return ALL messages with this SupportId, not just the first one
                var supports = await _dbcontext.Support
                    .Where(s => s.SupportId == supportId)
                    .OrderBy(s => s.dummyId) // Order by insertion order
                    .ToListAsync();

                _logger.LogInformation("💬 Found {Count} messages for Support ID {SupportId}", supports.Count, supportId);

                // Log each message for debugging
                foreach (var support in supports)
                {
                    _logger.LogInformation("Message {DummyId} in Support {SupportId}: User {UserId}, Title: '{Title}', Content: '{ContentPreview}'",
                        support.dummyId, support.SupportId, support.UserId, support.titlu,
                        support.comentariu.Length > 50 ? support.comentariu.Substring(0, 50) + "..." : support.comentariu);
                }

                return supports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving messages for Support ID {SupportId}", supportId);
                throw;
            }
        }

        public async Task<User> UserByID(int userId)
        {
            try
            {
                _logger.LogInformation("👤 Retrieving user with ID {UserId}", userId);

                var user = await _dbcontext.User.FirstOrDefaultAsync(x => x.Id == userId);

                if (user == null)
                {
                    _logger.LogWarning("⚠️ User {UserId} not found in database", userId);
                    throw new Exception($"Nu exista user cu id-ul {userId}");
                }

                _logger.LogInformation("✅ User {UserId} found: {Username}", userId, user.UserName);

                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving user {UserId}", userId);
                throw;
            }
        }
    }
}