import {
  loadnativeptr,
  offsetnativeptr,
  storenativeptr,
  unsafecontext,
} from "@tsonic/core/lang.js";
import type {
  NativePointer,
  int32,
  nativeInt,
} from "@tsonic/core/types.js";

export function copyAndRead(
  source: NativePointer<int32>,
  destination: NativePointer<int32>,
  elementOffset: nativeInt,
): int32 {
  unsafecontext();
  const selected = offsetnativeptr(source, elementOffset);
  const value = loadnativeptr(selected);
  storenativeptr(destination, value);
  return value;
}
