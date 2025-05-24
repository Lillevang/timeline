# Timeline DSL

A powerful and flexible timeline visualization tool that uses a custom Domain Specific Language (DSL) to create beautiful, interactive timelines. Perfect for project planning, roadmaps, and event tracking.

![image](https://github.com/user-attachments/assets/c5fa5ed5-4ed9-4192-bfa8-9c5bb9e830b5)


## Features

- **Custom DSL**: Define timelines using a simple, intuitive syntax
- **Interactive Visualization**: View and interact with your timeline in real-time
- **Multiple Elements**:
  - Tracks and rows for organizing content
  - Bars for time periods
  - Points for specific events
  - Milestones for important dates
- **Rich Styling**:
  - Custom colors for all elements
  - Multiple point shapes (circle, square, triangle)
  - Text positioning options
  - Label tokens for dynamic content
- **Export Options**:
  - Download as SVG for vector graphics
  - Download as PNG for raster images
- **Today Indicator**: Shows current date on the timeline
- **Week Numbers**: Optional display of ISO week numbers
- **Date Display**: Toggle between different date formats

**The design is not yet responsive and works best on a desktop/laptop monitor**

## Installation

```bash
# Clone the repository
git clone https://github.com/Lillevang/timeline.git

# Navigate to the project directory
cd timeline

# Install dependencies
npm install

# Start the development server
npm start
```

## Timeline DSL Syntax

### Basic Structure

```
track "Track Name"
  row "Row Name"
    bar "Bar Name" from YYYY-MM-DD to YYYY-MM-DD color blue
    point "Point Name" at YYYY-MM-DD color red shape circle
  row "Another Row"
    milestone "Milestone Name" at YYYY-MM-DD color green
```

### Elements

#### Tracks and Rows
```
track "Track Name"
  row "Row Name"
  row "Hidden Row" hidden
```

#### Bars
```
bar "Bar Name" from YYYY-MM-DD to YYYY-MM-DD color blue
bar "Left Label" from YYYY-MM-DD to YYYY-MM-DD color green text left
bar "Right Label" from YYYY-MM-DD to YYYY-MM-DD color red text right
```

#### Points
```
point "Point Name" at YYYY-MM-DD color blue shape circle
point "Square Point" at YYYY-MM-DD color red shape square
point "Triangle Point" at YYYY-MM-DD color green shape triangle
point "Down Triangle" at YYYY-MM-DD color purple shape triangle-down
```

#### Milestones
```
milestone "Milestone Name" at YYYY-MM-DD color blue
```

### Special Features

#### Label Tokens
Use tokens in labels to display dynamic content:
- `%date`: Shows the date in short format
- `%duration`: Shows the duration in days (for bars)

Example:
```
bar "Project Phase" from 2024-01-01 to 2024-02-01 color blue label "%date (%duration)"
```

#### Text Positioning
Control text position with `textAnchor`:
- `left`: Aligns text to the left
- `right`: Aligns text to the right
- `center`: Centers text (default)
- `top`: Places text above the element
- `bottom`: Places text below the element

#### Available Colors
- blue
- green
- yellow
- orange
- red
- purple
- gray

## Example

```
track "Project Timeline"
  row "Planning"
    bar "Requirements" from 2024-01-01 to 2024-01-15 color blue
    point "Kickoff" at 2024-01-01 color red shape circle
  row "Development"
    bar "Sprint 1" from 2024-01-15 to 2024-01-29 color green
    point "Demo" at 2024-01-29 color purple shape triangle
  row "Testing"
    bar "QA" from 2024-01-29 to 2024-02-12 color yellow
    milestone "Release" at 2024-02-12 color red
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
