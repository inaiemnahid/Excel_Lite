# Spreadsheet-Lite

A lightweight, high-performance spreadsheet web application built with Next.js, TypeScript, and React. Features a 100×50 grid with formulas, cell editing, undo/redo, and local persistence.

## Features

### Core Functionality
- **100×50 Grid** (Columns A-AX, Rows 1-100)
- **Formula Support** with dependency tracking and automatic recalculation
- **Functions**: SUM, AVG, MIN, MAX, COUNT
- **Cell References**: Relative (`A1`), Absolute (`$A$1`), Mixed (`A$1`, `$A1`)
- **Range References**: `A1:B10` for formulas
- **Cycle Detection**: Prevents circular reference errors
- **Error Handling**: `#ERROR!`, `#VALUE!`, `#REF!`, `#CYCLE!`, `#DIV/0!`

### User Interface
- **Virtualized Rendering** for optimal performance
- **Formula Bar** for viewing and editing cell content
- **Cell Inspector** showing cell details and computed values
- **Column Resizing** via drag handles
- **Multi-cell Selection** with Shift+click and Shift+arrows
- **Keyboard Navigation** (arrows, Tab, Home/End, PgUp/PgDn)
- **Double-click to Edit** cells
- **Error Boundary** for graceful error handling

### Data Management
- **Undo/Redo** support (Ctrl/Cmd+Z, Ctrl/Cmd+Y)
- **Auto-save** to localStorage (debounced, 500ms)
- **Export/Import** JSON backups
- **Reset** functionality with confirmation

### Accessibility
- **ARIA Grid** semantics (`role="grid"`, `role="gridcell"`)
- **Live Region** for screen reader announcements
- **Keyboard-first** navigation
- **Focus Management** with visible focus rings
- **Reduced Motion** support

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + React Testing Library
- **State**: React hooks (useState, useCallback, useMemo, useRef)
- **Persistence**: localStorage API

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/inaiemnahid/Excel_Lite.git
cd Excel_Lite

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## Usage

### Basic Operations

- **Select Cell**: Click on any cell
- **Edit Cell**: Double-click or press Enter
- **Commit Edit**: Press Enter or click outside
- **Cancel Edit**: Press Escape
- **Move Selection**: Arrow keys, Tab, Shift+Tab
- **Extend Selection**: Shift + Arrow keys or Shift + Click
- **Navigate**: Home (row start), End (row end), PgUp/PgDn (page scroll)

### Formulas

Formulas start with `=` and support:

```
=10 + 20                    // Arithmetic
=A1 * 2                     // Cell references
=SUM(A1:A10)               // Range functions
=$A$1 + B2                 // Absolute references
=(A1 + B1) * C1            // Parentheses
=AVG(A1:B10) + MIN(C1:C5)  // Nested functions
```

**Supported Operators**: `+`, `-`, `*`, `/`, `^` (exponentiation)

**Supported Functions**:
- `SUM(range)` - Sum of values
- `AVG(range)` or `AVERAGE(range)` - Average of values
- `MIN(range)` - Minimum value
- `MAX(range)` - Maximum value
- `COUNT(range)` - Count of numeric values

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow Keys | Move selection |
| Shift + Arrows | Extend selection |
| Enter | Start/commit edit, move down |
| Escape | Cancel edit, clear selection |
| Tab / Shift+Tab | Move right/left |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y | Redo |
| Home | Jump to column A |
| End | Jump to last column |
| PgUp / PgDn | Scroll by page |
| Any character | Start editing |

### Data Persistence

- **Auto-save**: Changes are automatically saved to localStorage after 500ms
- **Export**: Click "Export" button to download JSON backup
- **Import**: Click "Import" button to load JSON backup
- **Reset**: Click "Reset" button to clear all data (with confirmation)

## Architecture

### Project Structure

```
/app                    # Next.js app directory
  /layout.tsx          # Root layout
  /page.tsx            # Home page
/components            # React components
  /SheetApp.tsx        # Main application
  /Grid.tsx            # Virtualized grid
  /GridCell.tsx        # Individual cell (memoized)
  /FormulaBar.tsx      # Formula input bar
  /Inspector.tsx       # Cell details panel
  /ColumnHeader.tsx    # Column headers with resize
  /RowHeader.tsx       # Row headers
  /ErrorBoundary.tsx   # Error boundary
/hooks                 # Custom React hooks
  /useSelection.ts     # Selection management
  /useFormulaEngine.ts # Formula processing
  /useLocalStorage.ts  # Persistence
  /useA11yAnnouncer.ts # Screen reader support
  /useGridMeasurements.ts # Layout calculations
/lib                   # Core libraries
  /a1.ts              # A1 notation converter
  /parser.ts          # Formula parser
  /evaluator.ts       # Formula evaluator
  /graph.ts           # Dependency graph
  /fill.ts            # Fill handle logic
  /clipboard.ts       # Copy/paste utilities
/types                 # TypeScript types
  /sheet.ts           # Core type definitions
/tests                 # Unit tests
  /parser.test.ts     # Parser tests
  /evaluator.test.ts  # Evaluator tests
  /graph.test.ts      # Graph tests
  /a1.test.ts         # A1 utilities tests
/styles                # Global styles
  /globals.css        # CSS styles
```

### Key Design Decisions

1. **Virtualized Rendering**: Only visible cells are rendered for performance
2. **Memoization**: GridCell components are memoized to prevent unnecessary re-renders
3. **Dependency Graph**: Topological sorting ensures correct formula recalculation order
4. **Cycle Detection**: DFS algorithm detects circular references
5. **Debounced Save**: Reduces localStorage writes while ensuring data safety
6. **Pure Functions**: Parser and evaluator are side-effect free
7. **Accessibility First**: ARIA semantics and keyboard navigation built-in

## Testing

The project includes comprehensive unit tests:

- **Parser Tests** (18 tests): Tokenization, precedence, cell references, ranges, functions
- **Evaluator Tests** (19 tests): Arithmetic, type coercion, functions, error handling
- **Graph Tests** (11 tests): Dependency tracking, cycle detection, topological sorting
- **A1 Utilities Tests** (26 tests): Column conversion, address parsing, absolute references

**Current Coverage**: 74 tests passing

## Performance

### Benchmarks (Target)
- **Initial Render**: < 150ms
- **Scroll Performance**: > 55fps
- **Recalculation**: ≤ 16ms for typical edits

### Optimizations
- React.memo on GridCell prevents re-renders
- useMemo for computed values
- useCallback for stable function references
- Virtualization reduces DOM nodes
- Debounced localStorage writes

## Known Limitations

1. **Grid Size**: Fixed at 100×50 (can be changed in constants)
2. **Fill Handle**: Not yet implemented (planned feature)
3. **Copy/Paste**: In-app only, no system clipboard integration
4. **Cell Formatting**: Numbers displayed as-is, no formatting options
5. **Charts/Graphs**: Not supported
6. **Multi-user**: Single user only, no collaboration
7. **File Formats**: JSON only, no Excel/CSV import (CSV export planned)
8. **Formula Complexity**: Limited to basic arithmetic and aggregate functions
9. **Range Operations**: Functions work on ranges, but formulas cannot return arrays

## Future Enhancements

### Planned Features
- [ ] Fill handle for copying cells (drag from bottom-right corner)
- [ ] CSV import/export
- [ ] Cell formatting (number, currency, percentage)
- [ ] Conditional formatting
- [ ] Freeze rows/columns
- [ ] Additional functions (IF, VLOOKUP, etc.)
- [ ] Search and replace
- [ ] Cell comments
- [ ] Print support
- [ ] Dark mode

### Stretch Goals
- [ ] Web Worker for heavy calculations
- [ ] Collaborative editing (WebSocket)
- [ ] Plugin system for custom functions
- [ ] Macro recording
- [ ] Chart generation

## Contributing

This is a demonstration project showcasing React patterns, TypeScript, and spreadsheet algorithms. Feel free to:

1. Report issues or bugs
2. Suggest new features
3. Submit pull requests
4. Use as learning material

## License

ISC License

## Acknowledgments

Built as a technical demonstration of:
- React performance optimization
- Formula parsing and evaluation
- Dependency graph algorithms
- Accessibility best practices
- TypeScript type safety
- Test-driven development

---

**Note**: This is a client-side only application. All data is stored locally in your browser. No data is sent to any server.
