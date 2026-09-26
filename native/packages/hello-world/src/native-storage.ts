import { abi } from "test:abi";
import { addressof, equalptr, loadptr, storeptr, memorylayout,
  offsetrawptr, reinterpretrawptr, torawptr, unsafecontext } from "@tsonic/core/lang.js";
import type { Pointer, uint32 } from "@tsonic/core/types.js";

const word = memorylayout<uint32>({ datalayout: abi, bytesize: 4, bytealignment: 4, stride: 8, fields: [] });

function retainedElement(): Pointer<uint32> {
  unsafecontext();
  let values: uint32[] = [7, 8];
  const alias = values;
  const pointer = addressof(values[0]);
  const raw = torawptr(pointer, word);
  const same = addressof(alias[0]);
  if (!equalptr(pointer, same)) throw new Error("array element identity");
  storeptr(pointer, 9);
  if (alias[0] !== 9) throw new Error("array backing was copied");
  alias[0] = 11;
  const neighbor = reinterpretrawptr(offsetrawptr(raw, 8, abi), word);
  if (neighbor === undefined || loadptr(neighbor) !== 8) throw new Error("array stride");
  values = [99];
  if (loadptr(pointer) !== 11 || values[0] !== 99) throw new Error("array pointer retargeted");
  return same;
}

function retainedField(): Pointer<uint32> {
  let cell: { value: uint32 } = { value: 7 };
  const alias = cell;
  const pointer = addressof(cell.value);
  torawptr(pointer, word);
  storeptr(pointer, 9);
  if (alias.value !== 9) throw new Error("field backing was copied");
  alias.value = 11;
  cell = { value: 99 };
  if (loadptr(pointer) !== 11 || cell.value !== 99) throw new Error("field pointer retargeted");
  return pointer;
}

export function verifyNativeStorage(): boolean {
  unsafecontext();
  const element = retainedElement();
  const field = retainedField();
  const restored = reinterpretrawptr(torawptr(element, word), word);
  if (restored === undefined || !equalptr(restored, element)) return false;
  storeptr(restored, 21);
  storeptr(field, 22);
  return loadptr(element) === 21 && loadptr(field) === 22;
}
