# College Timetable Management System

## 1. About This Project

The **College Timetable Management System** is a web application for
creating, viewing, and managing college timetables.

It helps staff organize teachers, subjects, classes, lecture periods,
campuses, and daily schedules in one place. It also includes tools for
shuffling lecture assignments and planning a teacher's lectures across
two campuses.

The project is built with **Next.js** and **React**. It runs locally in
a web browser.

## 2. Main Features

### A. Manage the Timetable

-   View and edit timetable cells.
-   Organize timetable information such as college, campus, section,
    teacher, subject, lecture period, and timing.
-   Configure working days, holidays, and approval-related information.
-   Keep timetable changes in the browser's local storage, so changes
    can remain available when you reopen the app in the same browser.

**Important:** Local browser storage is not the same as a shared
database. Changes are not automatically shared with other computers or
users.

### B. Upload Files

The application provides a clearly labeled **Upload timetable** button below the timetable. Click it to open the file picker.

-   **Excel (`.xls`, `.xlsx`):** The application can import supported
    timetable-style spreadsheets.
-   **PDF (`.pdf`):** Opens as a visual reference so you can look at the
    existing timetable while working.
-   **PNG and JPG/JPEG images:** Opens as a visual reference.
-   **JSON (`.json`):** Can be used to restore supported timetable data
    saved in JSON format.

**Please note:** PDF and image files are not automatically converted
into editable timetable cells. You may need to enter their information
into the timetable yourself. Excel files with a very different layout
may not import correctly.

### C. Shuffle Lectures

The **Shuffle Lectures** feature randomly rearranges teacher/lecture
assignments for the selected working day.

Use it to explore alternative timetable arrangements. After shuffling:

1.  Review the timetable carefully.
2.  Check for teacher, class, subject, or timing conflicts.
3.  Correct any issues before using or publishing the timetable.

Do not assume a shuffled timetable is automatically conflict-free.

### D. Collapse and Reopen the Sidebar

The navigation sidebar has a burger/menu button.

-   Click the button to hide the sidebar and give the timetable more
    screen space.
-   Click it again to show the sidebar.

### E. Plan Lectures Across Two Campuses

The **Professor Planner** includes a campus-grouping suggestion to help
reduce unnecessary walking between two campuses.

For example, if a teacher has five lectures in one day, the desired
arrangement might be:

  Lecture periods   Campus
  ----------------- ----------
  1 and 2           Campus A
  3, 4 and 5        Campus B

This keeps the teacher at one campus for the first two lectures, then at
the other campus for the remaining three. The planner proposes changes
based on the existing timetable and aims to reduce campus switching.

**Review every suggestion before applying it.** The current feature
proposes campus grouping and swaps; it does not guarantee that every
teacher, classroom, class, subject, availability, or timing constraint
will be satisfied automatically.

## 3. Technology Used

-   **Next.js 14** --- web application framework.
-   **React 18** --- user interface.
-   **JavaScript** --- application logic.
-   **CSS** --- page layout and styling.
-   **xlsx-js-style** --- Excel spreadsheet handling.
-   **jsPDF** --- PDF export.
-   **html-to-image** --- image export.

## 4. Project Folder Structure

``` text
timetable-system-updated/
├── app/
│   ├── page.js          # Main application page
│   ├── layout.js        # App layout and page metadata
│   └── globals.css      # Global styles
├── components/
│   ├── Planner.js       # Professor/campus planning features
│   └── Sheet.js         # Timetable sheet and editing interface
├── lib/
│   ├── export.js        # Export and file-related helpers
│   └── schedule.js      # Timetable/scheduling logic
├── package.json         # Dependencies and run commands
└── README.md            # Project guide
```

## 5. Requirements

Before running the project, install:

-   **Node.js 18 or newer**
-   **npm** (normally installed with Node.js)
-   A modern web browser, such as Chrome or Edge
-   Visual Studio Code (recommended, but optional)

To check whether Node.js and npm are installed, open a terminal and run:

``` bash
node -v
npm -v
```

## 6. How to Install and Run

### Step 1: Extract the ZIP file

Extract `timetable-system-updated.zip` to a folder on your computer.

### Step 2: Open the project

Open Visual Studio Code, select **File → Open Folder**, and choose the
extracted `timetable-system-updated` folder.

### Step 3: Open the terminal

In VS Code, choose **Terminal → New Terminal**. Make sure the terminal
is inside the project folder---the folder that contains `package.json`.

### Step 4: Install dependencies

Run:

``` bash
npm install
```

Wait for the installation to finish.

### Step 5: Start the development server

Run:

``` bash
npm run dev
```

### Step 6: Open the application

Open this address in your browser:

``` text
http://localhost:3000
```

Keep the terminal running while you use the application. To stop the
server, press `Ctrl + C` in the terminal.

## 7. How to Build for Production

After installing the dependencies, run:

``` bash
npm run build
```

If the build completes successfully, you can start the production server
with:

``` bash
npm run start
```

Then open `http://localhost:3000`.

If an error appears, read the terminal message. It may identify a
missing dependency, a code issue, or an environment problem.

## 8. Suggested Workflow

1.  Open the timetable application.
2.  Review the college, campus, section, subject, teacher, and period
    information.
3.  Upload a supported Excel timetable, or use a PDF/image as a
    reference.
4.  Make any necessary timetable edits.
5.  Use **Shuffle Lectures** only when you want to try alternative
    assignments.
6.  Open **Professor Planner** to review campus grouping suggestions.
7.  Check teacher and class clashes, period timings, room availability,
    and campus changes.
8.  Export or save the timetable using the available options.
9.  Review the final timetable with the relevant staff before using it
    officially.

## 9. Current Limitations

Please keep these limitations in mind:

-   PDF and image uploads are reference previews; automatic OCR
    extraction into editable cells is not included.
-   Excel import is intended for the timetable structure supported by
    this application. A random Excel workbook may need to be reformatted
    first.
-   Shuffling can create conflicts, so the resulting timetable must be
    reviewed.
-   Campus grouping is a suggestion tool, not a complete optimization
    engine with guaranteed conflict-free results.
-   Timetable data is stored in the browser locally; there is no shared
    online database or multi-user synchronization configured in this
    project.
-   A production build should be tested on your computer before
    deployment.

## 10. Future Improvements

Possible future improvements include:

-   Reading timetable tables automatically from PDFs and images using
    OCR.
-   Importing more Excel layouts.
-   Automatically detecting teacher and classroom clashes.
-   Adding minimum travel-time rules between campuses.
-   Using a constraint solver to create a conflict-free timetable.
-   Adding user accounts, a database, and shared access for college
    staff.
-   Adding a confirmation step and an undo option for shuffle
    operations.

## 11. Troubleshooting

### `npm` is not recognized

Install Node.js 18 or newer, then close and reopen the terminal. Run
`node -v` and `npm -v` again.

### The page does not open

Make sure `npm run dev` is still running and open
`http://localhost:3000`.

### Port 3000 is already in use

Stop the other development server, or use the alternative local address
shown in the terminal if Next.js offers another port.

### An Excel file does not import correctly

Try opening the workbook in Excel and arranging the data to match the
timetable format supported by this application. Complex or unrelated
spreadsheets may not be recognized.

### A shuffled timetable has conflicts

Return to the timetable, correct the conflicting assignments, and review
the schedule before using it. Shuffle is intended to suggest
alternatives, not to guarantee a valid final timetable.

------------------------------------------------------------------------

## Project Status

This README describes the features and intended workflow of the supplied
project. Test the application and run `npm run build` in your own
environment before using it in production.

## 7. Academic directory and refreshed interface

The workspace now includes dedicated **Departments** and **Classes & sections** screens. Department names and class/year groups are stored in the timetable configuration and saved with the existing browser-local autosave. Campus sections can be edited in one place per campus and continue to drive the timetable grid, section totals, and clash checks.

The interface has been refreshed with a premium navy-and-indigo workspace, clearer navigation, compact status cards, consistent form controls, responsive layouts, and a collapsible sidebar. The application remains client-side and uses local browser storage; department/class information is not shared between computers unless a timetable backup is exported and imported.
#   T i m e _ S c h e d u l e _ S y s t e m  
 