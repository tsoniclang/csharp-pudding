import { attribute } from "@tsonic/core/lang.js";
import type { int32 } from "@tsonic/core/types.js";
import { DebuggerDisplayAttribute, DebuggerStepThroughAttribute } from "@tsonic/dotnet/System/Diagnostics.js";
import { InAttribute } from "@tsonic/dotnet/System/Runtime/InteropServices.js";

class Counter {
  value: int32;

  constructor(value: int32) {
    this.value = value;
  }

  get display(): int32 {
    return this.value;
  }

  increment(amount: int32): int32 {
    this.value += amount;
    return this.value;
  }
}

attribute<Counter>().add(() => new DebuggerDisplayAttribute("{value}"));
attribute<Counter>().constructor().add(() => new DebuggerStepThroughAttribute());
attribute<Counter>().constructor().parameter("value").add(() => new InAttribute());
attribute<Counter>().property(counter => counter.value).target("field").add(() => new DebuggerDisplayAttribute("value"));
attribute<Counter>().property(counter => counter.display).target("property").add(() => new DebuggerDisplayAttribute("display"));
attribute<Counter>().method(counter => counter.increment).add(() => new DebuggerStepThroughAttribute());
attribute<Counter>().method(counter => counter.increment).parameter("amount").add(() => new InAttribute());

export function verifyAttributes(): boolean {
  const counter = new Counter(1);
  return counter.increment(2) === 3 && counter.display === 3;
}
