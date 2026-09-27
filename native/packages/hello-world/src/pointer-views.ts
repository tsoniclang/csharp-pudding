import {
  bindptr,
  equalptr,
  hashptr,
  keepalive,
  loadptr,
  projectptr,
  storeptr,
} from "@tsonic/core/lang.js";
import type { int32 } from "@tsonic/core/types.js";

class Identity {
  value: int32 = 0;
}

export function verifyPointerViews(): boolean {
  const identity = new Identity();
  let value: int32 = 3;
  let reads: int32 = 0;
  let writes: int32 = 0;
  const pointer = bindptr<int32>(
    identity,
    () => { reads++; return value; },
    next => { writes++; value = next; },
  );
  const alias = bindptr<int32>(identity, () => value, next => { value = next; });
  const shifted = projectptr<int32, int32>(pointer, next => next + 1, next => next - 1);
  const missing = projectptr<int32, int32>(
    undefined,
    next => { reads++; return next; },
    next => { writes++; return next; },
  );
  if (!same(reads, 0) || !same(writes, 0) || missing !== undefined || hashptr<int32>(undefined) !== 0) return false;
  if (!equalptr(pointer, alias) || !equalptr(pointer, shifted)) return false;
  if (hashptr(pointer) !== hashptr(alias) || hashptr(pointer) !== hashptr(shifted)) return false;
  if (loadptr(shifted) !== 4) return false;
  storeptr(shifted, 10);
  if (!same(value, 9) || !same(reads, 1) || !same(writes, 1) || loadptr(alias) !== 9) return false;
  const flag = projectptr<int32, boolean>(pointer, next => next !== 0, next => next ? 1 : 0);
  if (hashptr(flag) !== hashptr(pointer)) return false;
  storeptr(flag, false);
  if (!same(value, 0) || loadptr(flag)) return false;
  keepalive(identity);
  return true;
}

function same(actual: int32, expected: int32): boolean {
  return actual === expected;
}
