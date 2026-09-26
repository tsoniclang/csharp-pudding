import { abi } from "test:abi";
import { verifyNativeStorage } from "./native-storage.js";
import { memorylayout, allocateptr, addressof, loadptr, storeptr,
  torawptr, reinterpretrawptr, equalptr, equalrawptr, hashptr,
  offsetrawptr, unsafecontext, keepalive } from "@tsonic/core/lang.js";
import type { Pointer, RawPointer, uint32, uint8 } from "@tsonic/core/types.js";
const word = memorylayout<uint32>({ datalayout: abi, bytesize: 4, bytealignment: 4, stride: 4, fields: [] });
const byte = memorylayout<uint8>({ datalayout: abi, bytesize: 1, bytealignment: 1, stride: 1, fields: [] });
function pass(pointer: Pointer<uint32>): Pointer<uint32> { return pointer; }
function genericPass<T>(pointer: Pointer<T>): Pointer<T> { return pointer; }
function closedGeneric() { return genericPass(allocateptr<uint32>(93)); }
function rawPass(pointer: RawPointer | undefined): RawPointer | undefined { return pointer; }
function create(): Pointer<uint32> { return allocateptr<uint32>(41); }
interface PointerHolder { pointer: Pointer<uint32> }
interface RawHolder { pointer: RawPointer | undefined }
function createRaw(): RawPointer | undefined { return torawptr(allocateptr<uint32>(51), word); }
function inferredRead(raw: RawPointer | undefined) {
  unsafecontext();
  return reinterpretrawptr(raw, word);
}
function inferredOptional(flag: boolean) {
  if (flag) return allocateptr<uint32>(81);
}
function annotatedOptional(flag: boolean): Pointer<uint32> | undefined {
  if (flag) return allocateptr<uint32>(82);
}
function callableReturns(): boolean {
  const callback = (flag: boolean) => {
    if (flag) return allocateptr<uint32>(90);
  };
  const value = callback(true);
  return value !== undefined && loadptr(value) === 90 &&
    callback(false) === undefined && loadptr(closedGeneric()) === 93;
}
function sameWord(actual: uint32, expected: uint32): boolean { return actual === expected; }
export function parameterRoundTrip(value: uint32 = 71): Pointer<uint32> {
  unsafecontext();
  const original = addressof(value);
  const view = reinterpretrawptr(torawptr(original, word), word);
  if (view !== undefined) storeptr(view, 72);
  if (value !== 72) throw new Error("native parameter alias");
  value = 73;
  return original;
}
export function verifyNativeMemory(): boolean {
  unsafecontext();
  let value: uint32 = 7;
  const original = addressof(value);
  const raw = rawPass(torawptr(pass(original), word));
  const restored = reinterpretrawptr(raw, word);
  if (restored === undefined) return false;
  if (!equalptr(original, restored) || hashptr(original) !== hashptr(restored)) return false;
  storeptr(restored, 9);
  if (value !== 9) return false;
  value = 17;
  if (loadptr(restored) !== 17) return false;
  const again = addressof(value);
  if (!equalptr(original, again)) return false;
  const firstByte = reinterpretrawptr(raw, byte);
  if (firstByte === undefined) return false;
  storeptr(firstByte, 33);
  if (value !== 33) return false;
  const retained = create();
  const retainedRaw = torawptr(retained, word);
  const retainedAlias = reinterpretrawptr(offsetrawptr(retainedRaw, 0, abi), word);
  if (retainedAlias === undefined) return false;
  storeptr(retainedAlias, 42);
  if (loadptr(retained) !== 42) return false;
  const pointers: Pointer<uint32>[] = [allocateptr<uint32>(61), allocateptr<uint32>(62)];
  const pointerAlias = pointers;
  const arrayView = reinterpretrawptr(torawptr(pointerAlias[1], word), word);
  if (arrayView === undefined) return false;
  storeptr(arrayView, 63);
  if (loadptr(pointers[1]) !== 63) return false;
  const previousElement = pointers[1];
  pointers[1] = allocateptr<uint32>(64);
  const changedElement = reinterpretrawptr(torawptr(pointers[1], word), word);
  if (changedElement === undefined) return false;
  storeptr(changedElement, 65);
  if (loadptr(pointers[1]) !== 65 || loadptr(previousElement) !== 63) return false;
  const holder: PointerHolder = { pointer: retained };
  const holderView = reinterpretrawptr(torawptr(holder.pointer, word), word);
  if (holderView === undefined) return false;
  storeptr(holderView, 44);
  if (loadptr(retained) !== 44) return false;
  const holderAlias = holder;
  holderAlias.pointer = allocateptr<uint32>(45);
  const changedField = reinterpretrawptr(torawptr(holder.pointer, word), word);
  if (changedField === undefined) return false;
  storeptr(changedField, 46);
  if (loadptr(holderAlias.pointer) !== 46 || loadptr(retained) !== 44) return false;
  const rawValues: (RawPointer | undefined)[] = [createRaw()];
  const rawHolder: RawHolder = { pointer: rawValues[0] };
  const ownerView = reinterpretrawptr(rawHolder.pointer, word);
  if (ownerView === undefined || loadptr(ownerView) !== 51) return false;
  storeptr(ownerView, 52);
  const ownerAlias = reinterpretrawptr(rawValues[0], word);
  if (ownerAlias === undefined || loadptr(ownerAlias) !== 52) return false;
  const incoming: uint32 = 71;
  const parameter = parameterRoundTrip(incoming);
  if (incoming !== 71 || loadptr(parameter) !== 73) return false;
  if (loadptr(parameterRoundTrip()) !== 73) return false;
  const inferred = inferredRead(raw);
  if (inferred === undefined || !equalptr(inferred, original)) return false;
  storeptr(inferred, 84);
  if (!sameWord(value, 84)) return false;
  const optional = inferredOptional(true);
  if (optional === undefined || loadptr(optional) !== 81 || inferredOptional(false) !== undefined) return false;
  const annotated = annotatedOptional(true);
  if (annotated === undefined || loadptr(annotated) !== 82 || annotatedOptional(false) !== undefined) return false;
  if (!callableReturns() || !verifyNativeStorage()) return false;
  const nil = torawptr<uint32>(undefined, word);
  if (!equalrawptr(nil, undefined) || reinterpretrawptr(nil, word) !== undefined) return false;
  keepalive(raw);
  return equalrawptr(torawptr(restored, word), raw);
}
