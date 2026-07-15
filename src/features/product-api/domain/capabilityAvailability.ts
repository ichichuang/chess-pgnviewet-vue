/**
 * Capability-availability projection for remote product families.
 *
 * This module is the single project-owned source of truth for whether a
 * contract-blocked capability may be exposed. It is intentionally pessimistic:
 * every listed remote family defaults to `contract-blocked` until a real,
 * confirmed contract exists. No caller may bypass this projection to render
 * success states, issue requests, or prompt for authentication.
 */

export type BlockedCapabilityFamily =
  | 'protected_replay'
  | 'cloud_content'
  | 'share_content'
  | 'live_board_positions'
  | 'live_moves'
  | 'live_credentials'
  | 'live_subscriptions'
  | 'live_mqtt'
  | 'authoritative_clocks'
  | 'clock_interpolation'
  | 'hardware_history'
  | 'hardware_latest_snapshot'
  | 'team_aggregates'
  | 'anonymous_live_display_scope'

export type CapabilityAvailability =
  | { kind: 'contract-blocked'; reason: string }
  | { kind: 'auth-required'; reason: string }
  | { kind: 'available'; reason: string }

const CONTRACT_BLOCKED_REASON = '真实读取合同尚未确认，当前不会发起请求，也不会显示成功内容。'

/**
 * Evaluate whether a remote capability family has a confirmed contract.
 *
 * Authentication is only considered *after* this function returns a confirmed
 * `available` or `auth-required` result. In the current phase every blocked
 * family lacks a real contract, so callers must render truthful unavailable
 * surfaces and must not emit requests.
 */
export function evaluateCapabilityAvailability(
  _family: BlockedCapabilityFamily
): CapabilityAvailability {
  // Direction 4: no confirmed contracts exist for any listed remote family.
  // When a real contract is confirmed, update this function with the specific
  // family check and any required auth/permission preconditions.
  return { kind: 'contract-blocked', reason: CONTRACT_BLOCKED_REASON }
}

export function isCapabilityAvailable(
  result: CapabilityAvailability
): result is { kind: 'available'; reason: string } {
  return result.kind === 'available'
}

export function isCapabilityContractBlocked(result: CapabilityAvailability): boolean {
  return result.kind === 'contract-blocked'
}

export function isCapabilityAuthRequired(
  result: CapabilityAvailability
): result is { kind: 'auth-required'; reason: string } {
  return result.kind === 'auth-required'
}

/**
 * Convenience evaluator for the protected-replay family.
 * Used by compatibility routes and the remote replay loader.
 */
export function evaluateProtectedReplayAvailability(): CapabilityAvailability {
  return evaluateCapabilityAvailability('protected_replay')
}

/**
 * Convenience evaluator for the live-spectator family group.
 * Used by `/competitions/:hdid/live` and venue-display live-board blocks.
 */
export function evaluateLiveSpectatorAvailability(): CapabilityAvailability {
  return evaluateCapabilityAvailability('live_board_positions')
}
