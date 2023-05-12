export var DiffType;
(function(DiffType) {
    DiffType["removed"] = "removed";
    DiffType["common"] = "common";
    DiffType["added"] = "added";
})(DiffType || (DiffType = {}));
const REMOVED = 1;
const COMMON = 2;
const ADDED = 3;
function createCommon(A, B, reverse) {
    const common = [];
    if (A.length === 0 || B.length === 0) return [];
    for(let i = 0; i < Math.min(A.length, B.length); i += 1){
        if (A[reverse ? A.length - i - 1 : i] === B[reverse ? B.length - i - 1 : i]) {
            common.push(A[reverse ? A.length - i - 1 : i]);
        } else {
            return common;
        }
    }
    return common;
}
/**
 * Renders the differences between the actual and expected values
 * @param A Actual value
 * @param B Expected value
 */ export function diff(A, B) {
    const prefixCommon = createCommon(A, B);
    const suffixCommon = createCommon(A.slice(prefixCommon.length), B.slice(prefixCommon.length), true).reverse();
    A = suffixCommon.length ? A.slice(prefixCommon.length, -suffixCommon.length) : A.slice(prefixCommon.length);
    B = suffixCommon.length ? B.slice(prefixCommon.length, -suffixCommon.length) : B.slice(prefixCommon.length);
    const swapped = B.length > A.length;
    [A, B] = swapped ? [
        B,
        A
    ] : [
        A,
        B
    ];
    const M = A.length;
    const N = B.length;
    if (!M && !N && !suffixCommon.length && !prefixCommon.length) return [];
    if (!N) {
        return [
            ...prefixCommon.map((c)=>({
                    type: DiffType.common,
                    value: c
                })),
            ...A.map((a)=>({
                    type: swapped ? DiffType.added : DiffType.removed,
                    value: a
                })),
            ...suffixCommon.map((c)=>({
                    type: DiffType.common,
                    value: c
                })), 
        ];
    }
    const offset = N;
    const delta = M - N;
    const size = M + N + 1;
    const fp = new Array(size).fill({
        y: -1
    });
    /**
   * INFO:
   * This buffer is used to save memory and improve performance.
   * The first half is used to save route and last half is used to save diff
   * type.
   * This is because, when I kept new uint8array area to save type,performance
   * worsened.
   */ const routes = new Uint32Array((M * N + size + 1) * 2);
    const diffTypesPtrOffset = routes.length / 2;
    let ptr = 0;
    let p = -1;
    function backTrace(A, B, current, swapped) {
        const M = A.length;
        const N = B.length;
        const result = [];
        let a = M - 1;
        let b = N - 1;
        let j = routes[current.id];
        let type = routes[current.id + diffTypesPtrOffset];
        while(true){
            if (!j && !type) break;
            const prev = j;
            if (type === REMOVED) {
                result.unshift({
                    type: swapped ? DiffType.removed : DiffType.added,
                    value: B[b]
                });
                b -= 1;
            } else if (type === ADDED) {
                result.unshift({
                    type: swapped ? DiffType.added : DiffType.removed,
                    value: A[a]
                });
                a -= 1;
            } else {
                result.unshift({
                    type: DiffType.common,
                    value: A[a]
                });
                a -= 1;
                b -= 1;
            }
            j = routes[prev];
            type = routes[prev + diffTypesPtrOffset];
        }
        return result;
    }
    function createFP(slide, down, k, M) {
        if (slide && slide.y === -1 && down && down.y === -1) {
            return {
                y: 0,
                id: 0
            };
        }
        if (down && down.y === -1 || k === M || (slide && slide.y) > (down && down.y) + 1) {
            const prev = slide.id;
            ptr++;
            routes[ptr] = prev;
            routes[ptr + diffTypesPtrOffset] = ADDED;
            return {
                y: slide.y,
                id: ptr
            };
        } else {
            const prev1 = down.id;
            ptr++;
            routes[ptr] = prev1;
            routes[ptr + diffTypesPtrOffset] = REMOVED;
            return {
                y: down.y + 1,
                id: ptr
            };
        }
    }
    function snake(k, slide, down, _offset, A, B) {
        const M = A.length;
        const N = B.length;
        if (k < -N || M < k) return {
            y: -1,
            id: -1
        };
        const fp = createFP(slide, down, k, M);
        while(fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]){
            const prev = fp.id;
            ptr++;
            fp.id = ptr;
            fp.y += 1;
            routes[ptr] = prev;
            routes[ptr + diffTypesPtrOffset] = COMMON;
        }
        return fp;
    }
    while(fp[delta + offset].y < N){
        p = p + 1;
        for(let k = -p; k < delta; ++k){
            fp[k + offset] = snake(k, fp[k - 1 + offset], fp[k + 1 + offset], offset, A, B);
        }
        for(let k1 = delta + p; k1 > delta; --k1){
            fp[k1 + offset] = snake(k1, fp[k1 - 1 + offset], fp[k1 + 1 + offset], offset, A, B);
        }
        fp[delta + offset] = snake(delta, fp[delta - 1 + offset], fp[delta + 1 + offset], offset, A, B);
    }
    return [
        ...prefixCommon.map((c)=>({
                type: DiffType.common,
                value: c
            })),
        ...backTrace(A, B, fp[delta + offset], swapped),
        ...suffixCommon.map((c)=>({
                type: DiffType.common,
                value: c
            })), 
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjkwLjAvdGVzdGluZy9fZGlmZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbnRlcmZhY2UgRmFydGhlc3RQb2ludCB7XG4gIHk6IG51bWJlcjtcbiAgaWQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGVudW0gRGlmZlR5cGUge1xuICByZW1vdmVkID0gXCJyZW1vdmVkXCIsXG4gIGNvbW1vbiA9IFwiY29tbW9uXCIsXG4gIGFkZGVkID0gXCJhZGRlZFwiLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERpZmZSZXN1bHQ8VD4ge1xuICB0eXBlOiBEaWZmVHlwZTtcbiAgdmFsdWU6IFQ7XG59XG5cbmNvbnN0IFJFTU9WRUQgPSAxO1xuY29uc3QgQ09NTU9OID0gMjtcbmNvbnN0IEFEREVEID0gMztcblxuZnVuY3Rpb24gY3JlYXRlQ29tbW9uPFQ+KEE6IFRbXSwgQjogVFtdLCByZXZlcnNlPzogYm9vbGVhbik6IFRbXSB7XG4gIGNvbnN0IGNvbW1vbiA9IFtdO1xuICBpZiAoQS5sZW5ndGggPT09IDAgfHwgQi5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbihBLmxlbmd0aCwgQi5sZW5ndGgpOyBpICs9IDEpIHtcbiAgICBpZiAoXG4gICAgICBBW3JldmVyc2UgPyBBLmxlbmd0aCAtIGkgLSAxIDogaV0gPT09IEJbcmV2ZXJzZSA/IEIubGVuZ3RoIC0gaSAtIDEgOiBpXVxuICAgICkge1xuICAgICAgY29tbW9uLnB1c2goQVtyZXZlcnNlID8gQS5sZW5ndGggLSBpIC0gMSA6IGldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbW1vbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbW1vbjtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlc1xuICogQHBhcmFtIEEgQWN0dWFsIHZhbHVlXG4gKiBAcGFyYW0gQiBFeHBlY3RlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlmZjxUPihBOiBUW10sIEI6IFRbXSk6IEFycmF5PERpZmZSZXN1bHQ8VD4+IHtcbiAgY29uc3QgcHJlZml4Q29tbW9uID0gY3JlYXRlQ29tbW9uKEEsIEIpO1xuICBjb25zdCBzdWZmaXhDb21tb24gPSBjcmVhdGVDb21tb24oXG4gICAgQS5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoKSxcbiAgICBCLnNsaWNlKHByZWZpeENvbW1vbi5sZW5ndGgpLFxuICAgIHRydWUsXG4gICkucmV2ZXJzZSgpO1xuICBBID0gc3VmZml4Q29tbW9uLmxlbmd0aFxuICAgID8gQS5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoLCAtc3VmZml4Q29tbW9uLmxlbmd0aClcbiAgICA6IEEuc2xpY2UocHJlZml4Q29tbW9uLmxlbmd0aCk7XG4gIEIgPSBzdWZmaXhDb21tb24ubGVuZ3RoXG4gICAgPyBCLnNsaWNlKHByZWZpeENvbW1vbi5sZW5ndGgsIC1zdWZmaXhDb21tb24ubGVuZ3RoKVxuICAgIDogQi5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoKTtcbiAgY29uc3Qgc3dhcHBlZCA9IEIubGVuZ3RoID4gQS5sZW5ndGg7XG4gIFtBLCBCXSA9IHN3YXBwZWQgPyBbQiwgQV0gOiBbQSwgQl07XG4gIGNvbnN0IE0gPSBBLmxlbmd0aDtcbiAgY29uc3QgTiA9IEIubGVuZ3RoO1xuICBpZiAoIU0gJiYgIU4gJiYgIXN1ZmZpeENvbW1vbi5sZW5ndGggJiYgIXByZWZpeENvbW1vbi5sZW5ndGgpIHJldHVybiBbXTtcbiAgaWYgKCFOKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC4uLnByZWZpeENvbW1vbi5tYXAoXG4gICAgICAgIChjKTogRGlmZlJlc3VsdDx0eXBlb2YgYz4gPT4gKHsgdHlwZTogRGlmZlR5cGUuY29tbW9uLCB2YWx1ZTogYyB9KSxcbiAgICAgICksXG4gICAgICAuLi5BLm1hcChcbiAgICAgICAgKGEpOiBEaWZmUmVzdWx0PHR5cGVvZiBhPiA9PiAoe1xuICAgICAgICAgIHR5cGU6IHN3YXBwZWQgPyBEaWZmVHlwZS5hZGRlZCA6IERpZmZUeXBlLnJlbW92ZWQsXG4gICAgICAgICAgdmFsdWU6IGEsXG4gICAgICAgIH0pLFxuICAgICAgKSxcbiAgICAgIC4uLnN1ZmZpeENvbW1vbi5tYXAoXG4gICAgICAgIChjKTogRGlmZlJlc3VsdDx0eXBlb2YgYz4gPT4gKHsgdHlwZTogRGlmZlR5cGUuY29tbW9uLCB2YWx1ZTogYyB9KSxcbiAgICAgICksXG4gICAgXTtcbiAgfVxuICBjb25zdCBvZmZzZXQgPSBOO1xuICBjb25zdCBkZWx0YSA9IE0gLSBOO1xuICBjb25zdCBzaXplID0gTSArIE4gKyAxO1xuICBjb25zdCBmcCA9IG5ldyBBcnJheShzaXplKS5maWxsKHsgeTogLTEgfSk7XG4gIC8qKlxuICAgKiBJTkZPOlxuICAgKiBUaGlzIGJ1ZmZlciBpcyB1c2VkIHRvIHNhdmUgbWVtb3J5IGFuZCBpbXByb3ZlIHBlcmZvcm1hbmNlLlxuICAgKiBUaGUgZmlyc3QgaGFsZiBpcyB1c2VkIHRvIHNhdmUgcm91dGUgYW5kIGxhc3QgaGFsZiBpcyB1c2VkIHRvIHNhdmUgZGlmZlxuICAgKiB0eXBlLlxuICAgKiBUaGlzIGlzIGJlY2F1c2UsIHdoZW4gSSBrZXB0IG5ldyB1aW50OGFycmF5IGFyZWEgdG8gc2F2ZSB0eXBlLHBlcmZvcm1hbmNlXG4gICAqIHdvcnNlbmVkLlxuICAgKi9cbiAgY29uc3Qgcm91dGVzID0gbmV3IFVpbnQzMkFycmF5KChNICogTiArIHNpemUgKyAxKSAqIDIpO1xuICBjb25zdCBkaWZmVHlwZXNQdHJPZmZzZXQgPSByb3V0ZXMubGVuZ3RoIC8gMjtcbiAgbGV0IHB0ciA9IDA7XG4gIGxldCBwID0gLTE7XG5cbiAgZnVuY3Rpb24gYmFja1RyYWNlPFQ+KFxuICAgIEE6IFRbXSxcbiAgICBCOiBUW10sXG4gICAgY3VycmVudDogRmFydGhlc3RQb2ludCxcbiAgICBzd2FwcGVkOiBib29sZWFuLFxuICApOiBBcnJheTx7XG4gICAgdHlwZTogRGlmZlR5cGU7XG4gICAgdmFsdWU6IFQ7XG4gIH0+IHtcbiAgICBjb25zdCBNID0gQS5sZW5ndGg7XG4gICAgY29uc3QgTiA9IEIubGVuZ3RoO1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBhID0gTSAtIDE7XG4gICAgbGV0IGIgPSBOIC0gMTtcbiAgICBsZXQgaiA9IHJvdXRlc1tjdXJyZW50LmlkXTtcbiAgICBsZXQgdHlwZSA9IHJvdXRlc1tjdXJyZW50LmlkICsgZGlmZlR5cGVzUHRyT2Zmc2V0XTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKCFqICYmICF0eXBlKSBicmVhaztcbiAgICAgIGNvbnN0IHByZXYgPSBqO1xuICAgICAgaWYgKHR5cGUgPT09IFJFTU9WRUQpIHtcbiAgICAgICAgcmVzdWx0LnVuc2hpZnQoe1xuICAgICAgICAgIHR5cGU6IHN3YXBwZWQgPyBEaWZmVHlwZS5yZW1vdmVkIDogRGlmZlR5cGUuYWRkZWQsXG4gICAgICAgICAgdmFsdWU6IEJbYl0sXG4gICAgICAgIH0pO1xuICAgICAgICBiIC09IDE7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IEFEREVEKSB7XG4gICAgICAgIHJlc3VsdC51bnNoaWZ0KHtcbiAgICAgICAgICB0eXBlOiBzd2FwcGVkID8gRGlmZlR5cGUuYWRkZWQgOiBEaWZmVHlwZS5yZW1vdmVkLFxuICAgICAgICAgIHZhbHVlOiBBW2FdLFxuICAgICAgICB9KTtcbiAgICAgICAgYSAtPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnVuc2hpZnQoeyB0eXBlOiBEaWZmVHlwZS5jb21tb24sIHZhbHVlOiBBW2FdIH0pO1xuICAgICAgICBhIC09IDE7XG4gICAgICAgIGIgLT0gMTtcbiAgICAgIH1cbiAgICAgIGogPSByb3V0ZXNbcHJldl07XG4gICAgICB0eXBlID0gcm91dGVzW3ByZXYgKyBkaWZmVHlwZXNQdHJPZmZzZXRdO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRlAoXG4gICAgc2xpZGU6IEZhcnRoZXN0UG9pbnQsXG4gICAgZG93bjogRmFydGhlc3RQb2ludCxcbiAgICBrOiBudW1iZXIsXG4gICAgTTogbnVtYmVyLFxuICApOiBGYXJ0aGVzdFBvaW50IHtcbiAgICBpZiAoc2xpZGUgJiYgc2xpZGUueSA9PT0gLTEgJiYgZG93biAmJiBkb3duLnkgPT09IC0xKSB7XG4gICAgICByZXR1cm4geyB5OiAwLCBpZDogMCB9O1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAoZG93biAmJiBkb3duLnkgPT09IC0xKSB8fFxuICAgICAgayA9PT0gTSB8fFxuICAgICAgKHNsaWRlICYmIHNsaWRlLnkpID4gKGRvd24gJiYgZG93bi55KSArIDFcbiAgICApIHtcbiAgICAgIGNvbnN0IHByZXYgPSBzbGlkZS5pZDtcbiAgICAgIHB0cisrO1xuICAgICAgcm91dGVzW3B0cl0gPSBwcmV2O1xuICAgICAgcm91dGVzW3B0ciArIGRpZmZUeXBlc1B0ck9mZnNldF0gPSBBRERFRDtcbiAgICAgIHJldHVybiB7IHk6IHNsaWRlLnksIGlkOiBwdHIgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJldiA9IGRvd24uaWQ7XG4gICAgICBwdHIrKztcbiAgICAgIHJvdXRlc1twdHJdID0gcHJldjtcbiAgICAgIHJvdXRlc1twdHIgKyBkaWZmVHlwZXNQdHJPZmZzZXRdID0gUkVNT1ZFRDtcbiAgICAgIHJldHVybiB7IHk6IGRvd24ueSArIDEsIGlkOiBwdHIgfTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzbmFrZTxUPihcbiAgICBrOiBudW1iZXIsXG4gICAgc2xpZGU6IEZhcnRoZXN0UG9pbnQsXG4gICAgZG93bjogRmFydGhlc3RQb2ludCxcbiAgICBfb2Zmc2V0OiBudW1iZXIsXG4gICAgQTogVFtdLFxuICAgIEI6IFRbXSxcbiAgKTogRmFydGhlc3RQb2ludCB7XG4gICAgY29uc3QgTSA9IEEubGVuZ3RoO1xuICAgIGNvbnN0IE4gPSBCLmxlbmd0aDtcbiAgICBpZiAoayA8IC1OIHx8IE0gPCBrKSByZXR1cm4geyB5OiAtMSwgaWQ6IC0xIH07XG4gICAgY29uc3QgZnAgPSBjcmVhdGVGUChzbGlkZSwgZG93biwgaywgTSk7XG4gICAgd2hpbGUgKGZwLnkgKyBrIDwgTSAmJiBmcC55IDwgTiAmJiBBW2ZwLnkgKyBrXSA9PT0gQltmcC55XSkge1xuICAgICAgY29uc3QgcHJldiA9IGZwLmlkO1xuICAgICAgcHRyKys7XG4gICAgICBmcC5pZCA9IHB0cjtcbiAgICAgIGZwLnkgKz0gMTtcbiAgICAgIHJvdXRlc1twdHJdID0gcHJldjtcbiAgICAgIHJvdXRlc1twdHIgKyBkaWZmVHlwZXNQdHJPZmZzZXRdID0gQ09NTU9OO1xuICAgIH1cbiAgICByZXR1cm4gZnA7XG4gIH1cblxuICB3aGlsZSAoZnBbZGVsdGEgKyBvZmZzZXRdLnkgPCBOKSB7XG4gICAgcCA9IHAgKyAxO1xuICAgIGZvciAobGV0IGsgPSAtcDsgayA8IGRlbHRhOyArK2spIHtcbiAgICAgIGZwW2sgKyBvZmZzZXRdID0gc25ha2UoXG4gICAgICAgIGssXG4gICAgICAgIGZwW2sgLSAxICsgb2Zmc2V0XSxcbiAgICAgICAgZnBbayArIDEgKyBvZmZzZXRdLFxuICAgICAgICBvZmZzZXQsXG4gICAgICAgIEEsXG4gICAgICAgIEIsXG4gICAgICApO1xuICAgIH1cbiAgICBmb3IgKGxldCBrID0gZGVsdGEgKyBwOyBrID4gZGVsdGE7IC0taykge1xuICAgICAgZnBbayArIG9mZnNldF0gPSBzbmFrZShcbiAgICAgICAgayxcbiAgICAgICAgZnBbayAtIDEgKyBvZmZzZXRdLFxuICAgICAgICBmcFtrICsgMSArIG9mZnNldF0sXG4gICAgICAgIG9mZnNldCxcbiAgICAgICAgQSxcbiAgICAgICAgQixcbiAgICAgICk7XG4gICAgfVxuICAgIGZwW2RlbHRhICsgb2Zmc2V0XSA9IHNuYWtlKFxuICAgICAgZGVsdGEsXG4gICAgICBmcFtkZWx0YSAtIDEgKyBvZmZzZXRdLFxuICAgICAgZnBbZGVsdGEgKyAxICsgb2Zmc2V0XSxcbiAgICAgIG9mZnNldCxcbiAgICAgIEEsXG4gICAgICBCLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIFtcbiAgICAuLi5wcmVmaXhDb21tb24ubWFwKFxuICAgICAgKGMpOiBEaWZmUmVzdWx0PHR5cGVvZiBjPiA9PiAoeyB0eXBlOiBEaWZmVHlwZS5jb21tb24sIHZhbHVlOiBjIH0pLFxuICAgICksXG4gICAgLi4uYmFja1RyYWNlKEEsIEIsIGZwW2RlbHRhICsgb2Zmc2V0XSwgc3dhcHBlZCksXG4gICAgLi4uc3VmZml4Q29tbW9uLm1hcChcbiAgICAgIChjKTogRGlmZlJlc3VsdDx0eXBlb2YgYz4gPT4gKHsgdHlwZTogRGlmZlR5cGUuY29tbW9uLCB2YWx1ZTogYyB9KSxcbiAgICApLFxuICBdO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLFdBS08sUUFJTjtVQUpXLFFBQVE7SUFBUixRQUFRLENBQ2xCLFNBQU8sSUFBUCxTQUFPO0lBREcsUUFBUSxDQUVsQixRQUFNLElBQU4sUUFBTTtJQUZJLFFBQVEsQ0FHbEIsT0FBSyxJQUFMLE9BQUs7R0FISyxRQUFRLEtBQVIsUUFBUTtBQVdwQixNQUFNLE9BQU8sR0FBRyxDQUFDLEFBQUM7QUFDbEIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxBQUFDO0FBQ2pCLE1BQU0sS0FBSyxHQUFHLENBQUMsQUFBQztBQUVoQixTQUFTLFlBQVksQ0FBSSxDQUFNLEVBQUUsQ0FBTSxFQUFFLE9BQWlCLEVBQU87SUFDL0QsTUFBTSxNQUFNLEdBQUcsRUFBRSxBQUFDO0lBQ2xCLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDaEQsSUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBRTtRQUN4RCxJQUNFLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUN2RTtZQUNBLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNoRCxNQUFNO1lBQ0wsT0FBTyxNQUFNLENBQUM7U0FDZjtLQUNGO0lBQ0QsT0FBTyxNQUFNLENBQUM7Q0FDZjtBQUVEOzs7O0dBSUcsQ0FDSCxPQUFPLFNBQVMsSUFBSSxDQUFJLENBQU0sRUFBRSxDQUFNLEVBQXdCO0lBQzVELE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEFBQUM7SUFDeEMsTUFBTSxZQUFZLEdBQUcsWUFBWSxDQUMvQixDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFDNUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQzVCLElBQUksQ0FDTCxDQUFDLE9BQU8sRUFBRSxBQUFDO0lBQ1osQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQ25CLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FDbEQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQ25CLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FDbEQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxBQUFDO0lBQ3BDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sR0FBRztRQUFDLENBQUM7UUFBRSxDQUFDO0tBQUMsR0FBRztRQUFDLENBQUM7UUFBRSxDQUFDO0tBQUMsQ0FBQztJQUNuQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxBQUFDO0lBQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEFBQUM7SUFDbkIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ3hFLElBQUksQ0FBQyxDQUFDLEVBQUU7UUFDTixPQUFPO2VBQ0YsWUFBWSxDQUFDLEdBQUcsQ0FDakIsQ0FBQyxDQUFDLEdBQTJCLENBQUM7b0JBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxNQUFNO29CQUFFLEtBQUssRUFBRSxDQUFDO2lCQUFFLENBQUMsQ0FDbkU7ZUFDRSxDQUFDLENBQUMsR0FBRyxDQUNOLENBQUMsQ0FBQyxHQUEyQixDQUFDO29CQUM1QixJQUFJLEVBQUUsT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU87b0JBQ2pELEtBQUssRUFBRSxDQUFDO2lCQUNULENBQUMsQ0FDSDtlQUNFLFlBQVksQ0FBQyxHQUFHLENBQ2pCLENBQUMsQ0FBQyxHQUEyQixDQUFDO29CQUFFLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTTtvQkFBRSxLQUFLLEVBQUUsQ0FBQztpQkFBRSxDQUFDLENBQ25FO1NBQ0YsQ0FBQztLQUNIO0lBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxBQUFDO0lBQ2pCLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLEFBQUM7SUFDcEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEFBQUM7SUFDdkIsTUFBTSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUFFLENBQUMsQUFBQztJQUMzQzs7Ozs7OztLQU9HLENBQ0gsTUFBTSxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQUFBQztJQUN2RCxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxBQUFDO0lBQzdDLElBQUksR0FBRyxHQUFHLENBQUMsQUFBQztJQUNaLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxBQUFDO0lBRVgsU0FBUyxTQUFTLENBQ2hCLENBQU0sRUFDTixDQUFNLEVBQ04sT0FBc0IsRUFDdEIsT0FBZ0IsRUFJZjtRQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEFBQUM7UUFDbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQUFBQztRQUNuQixNQUFNLE1BQU0sR0FBRyxFQUFFLEFBQUM7UUFDbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQUFBQztRQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEFBQUM7UUFDZCxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxBQUFDO1FBQzNCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLGtCQUFrQixDQUFDLEFBQUM7UUFDbkQsTUFBTyxJQUFJLENBQUU7WUFDWCxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU07WUFDdkIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxBQUFDO1lBQ2YsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO2dCQUNwQixNQUFNLENBQUMsT0FBTyxDQUFDO29CQUNiLElBQUksRUFBRSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsS0FBSztvQkFDakQsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ1osQ0FBQyxDQUFDO2dCQUNILENBQUMsSUFBSSxDQUFDLENBQUM7YUFDUixNQUFNLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRTtnQkFDekIsTUFBTSxDQUFDLE9BQU8sQ0FBQztvQkFDYixJQUFJLEVBQUUsT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU87b0JBQ2pELEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNaLENBQUMsQ0FBQztnQkFDSCxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ1IsTUFBTTtnQkFDTCxNQUFNLENBQUMsT0FBTyxDQUFDO29CQUFFLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTTtvQkFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFBRSxDQUFDLENBQUM7Z0JBQ3ZELENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNSO1lBQ0QsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQixJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxrQkFBa0IsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7S0FDZjtJQUVELFNBQVMsUUFBUSxDQUNmLEtBQW9CLEVBQ3BCLElBQW1CLEVBQ25CLENBQVMsRUFDVCxDQUFTLEVBQ007UUFDZixJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQ3BELE9BQU87Z0JBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQUUsRUFBRSxFQUFFLENBQUM7YUFBRSxDQUFDO1NBQ3hCO1FBQ0QsSUFDRSxBQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUN0QixDQUFDLEtBQUssQ0FBQyxJQUNQLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUN6QztZQUNBLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFLEFBQUM7WUFDdEIsR0FBRyxFQUFFLENBQUM7WUFDTixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDekMsT0FBTztnQkFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQUUsRUFBRSxFQUFFLEdBQUc7YUFBRSxDQUFDO1NBQ2hDLE1BQU07WUFDTCxNQUFNLEtBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxBQUFDO1lBQ3JCLEdBQUcsRUFBRSxDQUFDO1lBQ04sTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUksQ0FBQztZQUNuQixNQUFNLENBQUMsR0FBRyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsT0FBTyxDQUFDO1lBQzNDLE9BQU87Z0JBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFBRSxFQUFFLEVBQUUsR0FBRzthQUFFLENBQUM7U0FDbkM7S0FDRjtJQUVELFNBQVMsS0FBSyxDQUNaLENBQVMsRUFDVCxLQUFvQixFQUNwQixJQUFtQixFQUNuQixPQUFlLEVBQ2YsQ0FBTSxFQUNOLENBQU0sRUFDUztRQUNmLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEFBQUM7UUFDbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQUFBQztRQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU87WUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUFFLENBQUM7UUFDOUMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxBQUFDO1FBQ3ZDLE1BQU8sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUU7WUFDMUQsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLEVBQUUsQUFBQztZQUNuQixHQUFHLEVBQUUsQ0FBQztZQUNOLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDO1lBQ1osRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDVixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxNQUFNLENBQUM7U0FDM0M7UUFDRCxPQUFPLEVBQUUsQ0FBQztLQUNYO0lBRUQsTUFBTyxFQUFFLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUU7UUFDL0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUU7WUFDL0IsRUFBRSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxLQUFLLENBQ3BCLENBQUMsRUFDRCxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsRUFDbEIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQ2xCLE1BQU0sRUFDTixDQUFDLEVBQ0QsQ0FBQyxDQUNGLENBQUM7U0FDSDtRQUNELElBQUssSUFBSSxFQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFDLEdBQUcsS0FBSyxFQUFFLEVBQUUsRUFBQyxDQUFFO1lBQ3RDLEVBQUUsQ0FBQyxFQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUNwQixFQUFDLEVBQ0QsRUFBRSxDQUFDLEVBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQ2xCLEVBQUUsQ0FBQyxFQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUNsQixNQUFNLEVBQ04sQ0FBQyxFQUNELENBQUMsQ0FDRixDQUFDO1NBQ0g7UUFDRCxFQUFFLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FDeEIsS0FBSyxFQUNMLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUN0QixFQUFFLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsRUFDdEIsTUFBTSxFQUNOLENBQUMsRUFDRCxDQUFDLENBQ0YsQ0FBQztLQUNIO0lBQ0QsT0FBTztXQUNGLFlBQVksQ0FBQyxHQUFHLENBQ2pCLENBQUMsQ0FBQyxHQUEyQixDQUFDO2dCQUFFLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTTtnQkFBRSxLQUFLLEVBQUUsQ0FBQzthQUFFLENBQUMsQ0FDbkU7V0FDRSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQztXQUM1QyxZQUFZLENBQUMsR0FBRyxDQUNqQixDQUFDLENBQUMsR0FBMkIsQ0FBQztnQkFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLE1BQU07Z0JBQUUsS0FBSyxFQUFFLENBQUM7YUFBRSxDQUFDLENBQ25FO0tBQ0YsQ0FBQztDQUNIIn0=