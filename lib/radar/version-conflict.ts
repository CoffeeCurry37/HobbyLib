export class VersionConflictError extends Error {
 readonly code='VERSION_CONFLICT';
 constructor(){super('商品、偏好或关联已有并发修改，请重新读取后重试');}
}
export function isVersionConflict(error:unknown){
 return error instanceof VersionConflictError||error instanceof Error&&/NOT NULL constraint failed: scans\.data/.test(error.message);
}
