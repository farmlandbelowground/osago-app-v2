# Custom Hook Typing

Every custom hook **must** have a `types.ts` file and live in its own folder. The `types.ts` defines the hook's input shape (when applicable) and return shape; the implementation is typed via the hook's type alias.

## Directory Structure

Each custom hook is a self-contained folder with three files:

```
useHookName/
  useHookName.ts          # implementation
  types.ts                # Args (optional), Result, UseHookName alias
  index.ts                # public re-export
```

RSC-only data-fetching functions live in `queries.ts` (see [queries-in-rsc.md](./queries-in-rsc.md)); they are NOT custom hooks and do not follow this pattern.

## types.ts Structure

### Result Interface

The hook's return shape is declared as a `Result` interface, then aliased into the hook's type signature.

```typescript
// useUploadAvatar/types.ts
export interface Result {
  isReady: boolean
  execute: () => Promise<void>
}

export type UseUploadAvatar = () => Result
```

### Args + Result

When the hook accepts arguments, declare an `Args` interface paired with `Result`. The alias takes `Args` and returns `Result`.

```typescript
// useUploadAvatar/types.ts
export interface Args {
  userId: string
  onComplete?: () => void
}

export interface Result {
  isReady: boolean
  progress: number
  execute: (file: File) => Promise<void>
}

export type UseUploadAvatar = (args: Args) => Result
```

### Complex Sub-Types

When `Result` references nested shapes, extract sub-type interfaces alongside `Result` in the same `types.ts`. Keep the public alias narrow; sub-types are exported for documentation but rarely consumed externally.

```typescript
// useUploadAvatar/types.ts
export interface UploadResult {
  url: string
  uploadedAt: string
}

export interface Result {
  isReady: boolean
  lastUpload: UploadResult | null
  execute: (file: File) => Promise<UploadResult>
}

export type UseUploadAvatar = (args: Args) => Result
```

### Simple Return Types

When the return is a primitive, an alias is sufficient — no `Result` interface required.

```typescript
// useIsAuthenticated/types.ts
export type UseIsAuthenticated = () => boolean
```

## Hook Implementation

The implementation imports the type alias and applies it to the exported function. The body returns a value satisfying `Result` (or the primitive declared by the alias).

```typescript
// useUploadAvatar/useUploadAvatar.ts
import { type UseUploadAvatar } from './types'

export const useUploadAvatar: UseUploadAvatar = ({ userId, onComplete }) => {
  // ... hook body ...
  return {
    isReady: true,
    progress: 0,
    execute: async (file) => {
      // ... upload logic ...
      onComplete?.()
    },
  }
}
```

The type alias drives autocomplete and catches any drift in the returned shape at compile time.

## index.ts Re-Export

Each hook folder exposes its public surface through a small `index.ts` barrel. Re-export the hook function and the public types so consumers can import either with one path.

```typescript
// useUploadAvatar/index.ts
export { useUploadAvatar } from './useUploadAvatar'
export * from './types'
```

Every custom hook follows this typing discipline — `Result` interface, `UseHookName` type alias, explicit return types. Domain hooks like `useAuth`, `useLoginForm`, `useUploadAvatar` are subject to the same rules as cross-cutting hooks like `useDebounce`. No hook is exempt.
