export interface User {
  id: string;
  name: string;
  full_name?: string; // New field for full name
  email: string;
  avatar_url?: string;
  favorite_restaurants?: string[]; // Array of favorite restaurant IDs
  home_city?: string;
  role: 'user' | 'admin';
  created_at: string;
  password_set?: boolean;
  is_admin_user?: boolean;
  first_login_completed?: boolean;
  session_expires_at?: string;
  // Follow system fields
  followers_count?: number;
  following_count?: number;
}

// Public profile interface that excludes sensitive fields like role
export interface PublicProfile {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  favoriteRestaurants?: Restaurant[];
  stats: {
    reviewCount: number;
    favoritesCount: number;
  };
  // Follow system fields
  followers_count?: number;
  following_count?: number;
  followStatus?: FollowStatus;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  cuisine: string[];
  price_level: 1 | 2 | 3 | 4;
  website_url?: string;
  booking_url?: string;
  phone?: string;
  place_id?: string;
  source: 'manual' | 'maps';
  created_at: string;
  avg_rating?: number;
  review_count?: number;
  google_place_id?: string;
  google_maps_url?: string;
  google_data?: GooglePlaceData;
  last_google_sync?: string;
  aggregated_tags?: string[]; // Tags aggregated from all reviews for this restaurant
}

export interface GooglePlaceData {
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  types?: string[];
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
}

// ============================================================================
// DISH RATING SYSTEM TYPES
// ============================================================================

// Individual dish rating within a review
export interface DishRating {
  id?: string;
  dish_name: string;
  rating: number;
}

// Aggregated dish statistics for a restaurant
export interface DishAggregate {
  dish_name: string;
  avg_rating: number;
  rating_count: number;
}

// Dish autocomplete suggestion
export interface DishSuggestion {
  dish_name: string;
  avg_rating: number;
  rating_count: number;
}

export interface Review {
  id: string;
  restaurant_id: string;
  author_id: string;
  // Legacy multi-dimensional ratings (optional for backward compatibility)
  rating_overall: number;
  food?: number;
  service?: number;
  vibe?: number;
  value?: number;
  text?: string; // Legacy review text
  // New simplified review fields (Lovable format)
  dish?: string; // Legacy single dish field (deprecated)
  review?: string; // New review text field
  recommend?: boolean; // Legacy field
  tips?: string; // Legacy field
  // Dish-level ratings (new system)
  dish_ratings?: DishRating[];
  // Common fields
  visit_date: string;
  price_per_person?: number;
  visibility: 'my_circles' | 'public';
  tags?: string[]; // Legacy: Array of tags for categorization and filtering
  created_at: string;
  updated_at: string;
  // Like system fields
  like_count: number;
  isLikedByUser?: boolean;
  // Relationship data (can be from different API response formats)
  author?: User;
  restaurant?: Restaurant;
  users?: User; // From join query
  restaurants?: Restaurant; // From join query
  photos?: ReviewPhoto[];
}

export interface ReviewPhoto {
  id: string;
  review_id: string;
  path: string;
  width: number;
  height: number;
}

export interface Invite {
  id: string;
  inviter_id: string;
  code: string;
  email?: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  inviter?: User;
}

export interface Report {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  review?: Review;
  reporter?: User;
}

export interface UserList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  restaurants: string[];
  created_at: string;
  updated_at: string;
}

export interface MagicLinkRequest {
  id: string;
  email: string;
  requested_by_ip?: string;
  requested_by_user_agent?: string;
  status: 'pending' | 'approved' | 'denied';
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  processor?: User;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  passwordSet: boolean;
  isAdmin: boolean;
  firstLoginCompleted: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface MagicLinkRequestData {
  email: string;
  userAgent?: string;
  ipAddress?: string;
}

// ============================================================================
// INVITE CODE SYSTEM TYPES
// ============================================================================

export interface InviteCode {
  id: string;
  code: string;
  description?: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InviteCodeUsage {
  id: string;
  invite_code_id: string;
  user_id: string;
  used_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface InviteCodeValidation {
  valid: boolean;
  message: string;
  code_id?: string;
  description?: string;
  uses_remaining?: number;
}

export interface InviteCodeUsageResult {
  success: boolean;
  message: string;
  code_id?: string;
}

// New auth flow types
export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
}

export interface InviteCodeSession {
  code: string;
  validatedAt: string;
  codeId: string;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

// To-Eat List types
export interface ToEatListItem {
  user_id: string;
  restaurant_id: string;
  created_at: string;
  restaurant: Restaurant;
}

export interface ToEatListResponse {
  restaurants: (Restaurant & { savedAt: string })[];
  count: number;
}

// ============================================================================
// GROUP SYSTEM TYPES
// ============================================================================

export type GroupRole = 'owner' | 'admin' | 'member';

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed fields from API
  member_count?: number;
  user_role?: GroupRole;
  joined_at?: string;
}

export interface UserGroup {
  id: string;
  user_id: string;
  group_id: string;
  role: GroupRole;
  joined_at: string;
  // Joined data
  group?: Group;
  user?: User;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: GroupRole;
  joined_at: string;
  // User data
  user: Pick<User, 'id' | 'name' | 'full_name' | 'email' | 'avatar_url'>;
}

export interface GroupWithDetails extends Group {
  member_count: number;
  user_role: GroupRole;
  joined_at: string;
  members?: GroupMember[];
}

export interface GroupFeedContext {
  selectedGroup: Group | null;
  userGroups: Group[];
  isLoading: boolean;
}

// Updated types for group-enabled features
export interface GroupEnabledReview extends Review {
  group_id?: string;
  group?: Group;
}

export interface GroupEnabledInviteCode extends InviteCode {
  group_id?: string;
  group?: Group;
}

// API Response types
export interface GroupsResponse {
  groups: Group[];
  count: number;
}

export interface GroupMembersResponse {
  members: GroupMember[];
  count: number;
}

// Group creation and management
export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
}

export interface CreateGroupResponse {
  success: boolean;
  group_id: string;
  message: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
}

export interface JoinGroupResponse {
  success: boolean;
  group_id: string;
  message: string;
}

// ============================================================================
// RBAC SYSTEM TYPES
// ============================================================================

// Capability-based access control
export type Capability = 
  | 'create_group'       // Admin only - can create new groups
  | 'manage_any_group'   // Admin only - can manage all groups
  | 'view_audit_log'     // Admin only - can view audit logs
  | 'manage_invites'     // Admin only - invite code management
  | 'post_review'        // All users - post reviews
  | 'manage_roles'       // Owner/Admin - manage roles within group
  | 'invite_member'      // All members - invite others to group
  | 'remove_member'      // Owner/Admin - remove members
  | 'edit_group'         // Owner/Admin - edit group info
  | 'delete_group'       // Owner only - delete group
  | 'transfer_ownership'; // Owner only - transfer ownership

// User permissions context
export interface PermissionContext {
  userId: string;
  globalRole: 'admin' | 'user';
  groupRole?: GroupRole;
  groupId?: string;
  capabilities: Capability[];
}

// Permission check results
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
  missingCapability?: Capability;
}

// ============================================================================
// AUDIT SYSTEM TYPES
// ============================================================================

// Audit action types matching database enum
export type AuditAction = 
  | 'group_created'
  | 'group_updated'
  | 'group_deleted'
  | 'role_assigned'
  | 'role_changed'
  | 'role_revoked'
  | 'member_added'
  | 'member_removed'
  | 'invite_code_generated'
  | 'ownership_transferred';

// Audit target types matching database enum
export type AuditTargetType = 'group' | 'user' | 'invite_code';

// Audit log entry
export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: string;
  group_id?: string;
  metadata: Record<string, any>;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Joined data
  actor?: Pick<User, 'id' | 'name' | 'full_name' | 'email'>;
  target_user?: Pick<User, 'id' | 'name' | 'full_name' | 'email'>;
  group?: Pick<Group, 'id' | 'name'>;
}

// API response types for audit logs
export interface AuditLogResponse {
  entries: AuditLogEntry[];
  count: number;
  has_more: boolean;
}

// Audit log filters
export interface AuditLogFilters {
  action?: AuditAction;
  actor_id?: string;
  group_id?: string;
  target_type?: AuditTargetType;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// ROLE MANAGEMENT TYPES
// ============================================================================

// Role update request
export interface UpdateRoleRequest {
  user_id: string;
  group_id: string;
  new_role: GroupRole;
  reason?: string;
}

// Role update response
export interface UpdateRoleResponse {
  success: boolean;
  old_role: GroupRole;
  new_role: GroupRole;
  audit_id: string;
  message: string;
}

// Member removal request
export interface RemoveMemberRequest {
  user_id: string;
  group_id: string;
  reason?: string;
}

// Member removal response
export interface RemoveMemberResponse {
  success: boolean;
  removed_role: GroupRole;
  audit_id: string;
  message: string;
}

// Transfer ownership request
export interface TransferOwnershipRequest {
  current_owner_id: string;
  new_owner_id: string;
  group_id: string;
  reason?: string;
}

// Transfer ownership response
export interface TransferOwnershipResponse {
  success: boolean;
  audit_id: string;
  message: string;
}

// Group with RBAC context
export interface GroupWithRBAC extends Group {
  user_capabilities: Capability[];
  can_edit: boolean;
  can_invite: boolean;
  can_manage_roles: boolean;
  can_delete: boolean;
}

// ============================================================================
// FOLLOWING SYSTEM TYPES
// ============================================================================

// Follow status between current user and target user
export interface FollowStatus {
  isFollowing: boolean;
  hasPendingRequest: boolean;
  isFollower: boolean;
}

// Follow request (pending approval)
export interface FollowRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  requester?: Pick<User, 'id' | 'name' | 'full_name' | 'avatar_url'>;
}

// User info in follower/following lists
export interface UserFollowInfo {
  follow_id: string;
  user_id: string;
  user_name: string;
  user_full_name: string | null;
  user_avatar_url: string | null;
  followed_at: string;
  is_following_back?: boolean;
  is_followed_by_viewer?: boolean;
}

// Follow action response
export interface FollowActionResponse {
  success: boolean;
  message: string;
  error?: string;
  status?: 'following' | 'requested' | 'none';
}

// Followers/Following list response
export interface FollowListResponse {
  users: UserFollowInfo[];
  hasMore: boolean;
  nextCursor?: {
    created_at: string;
    id: string;
  };
}

// Pending follow requests response
export interface FollowRequestsResponse {
  requests: {
    request_id: string;
    requester_id: string;
    requester_name: string;
    requester_full_name: string | null;
    requester_avatar_url: string | null;
    requested_at: string;
  }[];
  count: number;
}