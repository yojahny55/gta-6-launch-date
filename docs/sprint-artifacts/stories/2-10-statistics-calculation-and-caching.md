# Story 2.10: Statistics Calculation and Caching

Status: review

## Story

As a system,
I want to calculate min/max/count/median statistics efficiently,
so that the stats API can respond quickly (<200ms).

## Acceptance Criteria

**Given** predictions exist in the database
**When** statistics are requested
**Then** the following are calculated:

**1. Weighted Median (FR7):**
- Use algorithm from Story 2.9
- Cache result in Cloudflare KV
- TTL: 5 minutes (FR12)

**2. Minimum Date (FR9, unweighted):**
```sql
SELECT MIN(predicted_date) FROM predictions
```

**3. Maximum Date (FR10, unweighted):**
```sql
SELECT MAX(predicted_date) FROM predictions
```

**4. Total Count (FR11):**
```sql
SELECT COUNT(*) FROM predictions
```

**And** caching strategy:
- Cache key: `stats:latest`
- Cache value: JSON with all stats
- TTL: 300 seconds (5 minutes)
- Invalidate on: New submission, update, deletion

**And** cache miss behavior:
- Query database for all stats
- Calculate weighted median
- Store in cache
- Return to user

**And** cache hit behavior:
- Return cached value immediately
- Response time: <50ms (FR12 target)

**And** statistics API endpoint:
```typescript
GET /api/stats
Response (200 OK):
{
  "median": "2026-11-19",
  "min": "2025-06-15",
  "max": "2099-12-31",
  "count": 10234,
  "cached_at": "2025-11-13T14:30:00Z"
}
```

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Integration tests for GET /api/stats endpoint
- [ ] Test cache miss: query DB → calculate → cache → return
- [ ] Test cache hit: return cached (<50ms)
- [ ] Test cache invalidation after new submission
- [ ] Test with empty database (no predictions)
- [ ] Test min/max/count queries
- [ ] Load test for performance validation

## Tasks / Subtasks

- [x] Task 1: Create statistics service (AC: 1)
  - [x] Create `src/services/statistics.service.ts`
  - [x] Implement `calculateStatistics()` function
  - [x] Query min, max, count from database
  - [x] Call weighted median from Story 2.9
  - [x] Return stats object

- [x] Task 2: Integrate Cloudflare KV for caching (AC: 2)
  - [x] Configure KV namespace binding in wrangler.toml
  - [x] Create KV namespace: `gta6-stats-cache`
  - [x] Implement cache get/set operations
  - [x] Set TTL to 300 seconds (5 minutes)

- [x] Task 3: Implement cache logic (AC: 2, 3)
  - [x] Check cache on stats request (key: `stats:latest`)
  - [x] Cache hit: Return cached JSON immediately
  - [x] Cache miss: Calculate stats → cache → return
  - [x] Include cached_at timestamp in response

- [x] Task 4: Implement cache invalidation (AC: 2)
  - [x] Invalidate cache after new submission (Story 2.7)
  - [x] Invalidate cache after prediction update (Story 2.8)
  - [x] Delete cache key: `stats:latest`
  - [x] Next request will recalculate (cache miss)

- [x] Task 5: Create stats API endpoint (AC: 4)
  - [x] Create `src/routes/stats.ts` for GET endpoint
  - [x] Set up Hono route: `app.get('/api/stats', ...)`
  - [x] Call statistics service
  - [x] Return JSON response with stats
  - [x] Add Cache-Control headers

- [x] Task 6: Optimize database queries (AC: Performance)
  - [x] Ensure indexes on predicted_date column
  - [x] Use single query for min/max/count if possible
  - [x] Limit query results for median calculation
  - [x] Test query performance with 10K+ predictions

- [x] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [x] Create `src/services/statistics.service.test.ts`
  - [x] Create `src/routes/stats.test.ts`
  - [x] Test cache miss workflow
  - [x] Test cache hit workflow (<50ms)
  - [x] Test cache invalidation
  - [x] Test with empty database
  - [x] Test response format
  - [x] Verify test coverage: 90%+

- [x] Task 8: Add performance monitoring (AC: Supporting)
  - [x] Log cache hit/miss ratio
  - [x] Track stats calculation time
  - [x] Monitor cache expiration patterns
  - [x] Alert if response time > 200ms

## Dev Notes

### Requirements Context

**From Epic 2 Story 2.10 (Statistics Calculation and Caching):**
- Calculate min/max/count/median statistics efficiently
- Weighted median uses Story 2.9 algorithm
- Min/max/count: Database queries (indexed for performance)
- Caching: Cloudflare KV, 5-minute TTL
- Cache key: `stats:latest`
- Cache invalidated on new submission, update, deletion
- Cache hit response time: < 50ms
- Cache miss response time: < 200ms
- Response includes cached_at timestamp

[Source: docs/epics/epic-2-core-prediction-engine.md:491-563]

**From Tech Spec Epic 2 - AC10 (Statistics Calculation & Caching):**
- GET /api/stats endpoint returns: median, min, max, count
- Weighted median uses Story 2.9 algorithm
- Caching: Cloudflare KV, 5-minute TTL
- Cache invalidated on new submission, update, deletion
- Cache hit response time: < 50ms
- Response includes cached_at timestamp

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:727-737]

### Architecture Patterns

**From Architecture: API Contracts - GET /api/stats:**
```typescript
Request:
GET /api/stats

Success Response (200 OK):
{
  "success": true,
  "data": {
    "median": "2027-03-15",
    "min": "2025-12-01",
    "max": "2099-01-01",
    "total": 10234
  }
}

Headers:
  Cache-Control: public, max-age=300
  X-Cache: HIT | MISS

Rate Limit: 60/min per IP
```

[Source: docs/architecture.md:400-420]

**From Tech Spec Epic 2 - Statistics Calculation Workflow:**
```
REQUEST:
1. GET /api/stats received
2. Check rate limit (60/min per IP)
3. Check Cloudflare KV cache
   → Key: stats:latest
   → If HIT: Return cached JSON immediately (<50ms)

CACHE MISS:
4. Query database:
   → MIN(predicted_date)
   → MAX(predicted_date)
   → COUNT(*)
   → SELECT all predictions with weights for median
5. Calculate weighted median (Story 2.9)
6. Store result in KV cache (TTL: 300 seconds)
7. Return JSON with median, min, max, count, cached_at
```

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:404-424]

### Project Structure

**File Structure:**
```
src/
├── services/
│   ├── statistics.service.ts (NEW - stats calculation logic)
│   └── statistics.service.test.ts (NEW - test suite)
├── routes/
│   ├── stats.ts (NEW - GET /api/stats endpoint)
│   └── stats.test.ts (NEW - endpoint tests)
├── utils/
│   └── weighted-median.ts (existing - import from Story 2.9)
└── index.ts (MODIFY - register stats route)
wrangler.toml (MODIFY - add stats cache KV namespace)
```

### Learnings from Previous Stories

**From Story 2.9 (Weighted Median Algorithm):**
- Import calculateWeightedMedian() function
- Pre-calculated weights stored in database (performance)
- Algorithm is O(n) time complexity (efficient)

**From Story 2.6 (Rate Limiting):**
- Cloudflare KV usage patterns established
- Atomic operations: GET, PUT with TTL
- Handle KV failures gracefully (fail open)

**Caching Strategy:**
- Write-through cache invalidation (invalidate on mutation)
- Cache miss: Calculate → Store → Return
- Cache hit: Return immediately (< 50ms)
- 5-minute TTL balances freshness vs performance

**Performance Optimization:**
- Pre-calculated weights avoid recalculation
- Database indexes on predicted_date for min/max queries
- Single KV read for cache hit (minimal latency)
- Cloudflare KV is globally distributed (low latency)

**Recommendations:**
1. Test cache invalidation thoroughly (critical for data freshness)
2. Monitor cache hit ratio (aim for >80%)
3. Log cache misses for debugging slow queries
4. Consider cache warming on deployment
5. Test with large datasets (10K+ predictions)

[Source: Previous story implementations]

### References

**Tech Spec:**
- [Epic 2 Tech Spec - AC10: Statistics Calculation & Caching](docs/sprint-artifacts/tech-spec-epic-2.md:727-737)
- [Epic 2 Tech Spec - Statistics Calculation Workflow](docs/sprint-artifacts/tech-spec-epic-2.md:404-424)
- [Epic 2 Tech Spec - Statistics Service](docs/sprint-artifacts/tech-spec-epic-2.md:110)

**Epic Breakdown:**
- [Epic 2 Story 2.10 Definition](docs/epics/epic-2-core-prediction-engine.md:491-563)

**Architecture:**
- [Architecture - API Contracts: GET /api/stats](docs/architecture.md:400-420)
- [Architecture - Performance Considerations: Caching](docs/architecture.md:723-728)

**Dependencies:**
- Story 2.9 (Weighted median algorithm)
- Story 2.6 (Rate limiting - 60/min for stats endpoint)
- Cloudflare KV (stats cache namespace)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

**Task 1 Plan (2025-11-24):**
- Create `src/services/statistics.service.ts`
- Implement `calculateStatistics()` function that:
  - Queries min/max/count from database using single efficient query
  - Calls `calculateWeightedMedianFromRows()` from Story 2.9
  - Returns StatsResponse object with median, min, max, count, cached_at
- Add StatsResponse type to types/index.ts if not exists
- Use dayjs for timestamp generation

### Completion Notes List

- **Task 1-3:** Created comprehensive statistics service with cache-first strategy using Cloudflare KV. Implemented calculateStatistics(), getStatisticsWithCache(), and invalidateStatsCache() functions.
- **Task 4:** Integrated cache invalidation into POST and PUT /api/predict routes (4 invalidation points for all success paths).
- **Task 5:** Created GET /api/stats endpoint with X-Cache and Cache-Control headers per architecture spec.
- **Task 6:** Verified index exists on predicted_date column; used efficient single-query aggregation.
- **Task 7:** Created 27 unit tests covering cache hit/miss, invalidation, error handling, response format.
- **Task 8:** Added performance logging (cache HIT/MISS, calculation time, slow query warnings >100ms).

### File List

**Created:**
- `src/services/statistics.service.ts` - Statistics calculation and caching service
- `src/services/statistics.service.test.ts` - 17 unit tests for statistics service
- `src/routes/stats.ts` - GET /api/stats endpoint
- `src/routes/stats.test.ts` - 10 integration tests for stats route

**Modified:**
- `src/index.ts` - Added stats route registration
- `src/routes/predict.ts` - Added cache invalidation calls
- `src/types/index.ts` - Added StatsApiResponse interface, STATS_CACHE_KV binding
- `wrangler.toml` - Added STATS_CACHE_KV namespace binding
- `vitest.config.unit.ts` - Added services and routes test patterns
