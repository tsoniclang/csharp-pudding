import { Console, InvalidOperationException } from "@tsonic/dotnet/System.js";
import { verifyPointerViews } from "./pointer-views.js";
import { verifyNativeMemory } from "./native-memory.js";
import { verifyAttributes } from "./attributes.js";
import {
  addressof,
  allocateptr,
  defaultvalue,
  equalptr,
  field,
  loadptr,
  storeptr,
  struct,
} from "@tsonic/core/lang.js";
import type { int32, Pointer } from "@tsonic/core/types.js";

export const Pair = struct({
  left: field<int32>(),
  right: field<int32>(),
});

function increment(pointer: Pointer<int32>): void {
  storeptr(pointer, loadptr(pointer) + 1);
}

function create(initial: int32): Pointer<int32> {
  return allocateptr<int32>(initial);
}

function updatePair(): int32 {
  let pair: typeof Pair = defaultvalue<typeof Pair>();
  pair.left = 1;
  const first = addressof(pair.left);
  const second = addressof(pair.left);
  storeptr(first, 3);
  return equalptr(first, second) ? loadptr(second) : pair.right;
}

export function main(): void {
  if (!verifyAttributes()) throw new InvalidOperationException("attribute contract failed");
  if (!verifyPointerViews()) throw new InvalidOperationException("pointer view contract failed");
  if (!verifyNativeMemory()) throw new InvalidOperationException("native memory contract failed");
  let local: int32 = 1;
  const alias = addressof(local);
  increment(alias);

  const allocated = create(40);
  const independent = create(10);
  increment(allocated);

  const aliasIdentity = equalptr(alias, addressof(local));
  const allocationIdentity = equalptr(allocated, independent);
  const missingIdentity = equalptr<int32>(undefined, undefined);

  const values: int32[] = [3, 5];
  const element = addressof(values[0]);
  const elementIdentity = equalptr(element, addressof(values[0]));
  const otherElementIdentity = equalptr(element, addressof(values[1]));
  storeptr(element, 4);

  Console.WriteLine(
    `Pointers: ${local}, ${loadptr(allocated)}, ${loadptr(independent)}, ${values[0]}`,
  );
  Console.WriteLine(
    `Pointer identity: ${aliasIdentity}, ${allocationIdentity}, ${missingIdentity}, ${elementIdentity}, ${otherElementIdentity}`,
  );
  Console.WriteLine(`Pointer value field: ${updatePair()}`);
  Console.WriteLine("Hello from Tsonic!");
}

main();
