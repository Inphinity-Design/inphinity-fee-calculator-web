import { ParentTaskGroup } from '@/types/calculator';

// Sub-task data based on user's screenshots
// Base hours are from the screenshots, will be scaled based on app task weights

export const parentTaskGroups: ParentTaskGroup[] = [
    {
        id: 'group-1',
        name: 'Market and Trend Analysis',
        appTaskId: 'task-8', // NEW - Weight: 9 (sum of moved sub-tasks base hours)
        subTasks: [
            { id: 'st-8-1', name: 'Trends', baseHours: 1, parentTaskId: 'task-8' },
            { id: 'st-8-2', name: 'Materials', baseHours: 1, parentTaskId: 'task-8' },
            { id: 'st-8-3', name: 'Building Technologies', baseHours: 2, parentTaskId: 'task-8' },
            { id: 'st-8-4', name: 'Competitors', baseHours: 2, parentTaskId: 'task-8' },
            { id: 'st-8-5', name: 'SWOT', baseHours: 2, parentTaskId: 'task-8' },
            { id: 'st-8-6', name: 'Resonance Solutions', baseHours: 1, parentTaskId: 'task-8' },
        ],
    },
    {
        id: 'group-2',
        name: 'Land Evaluation and Site Analysis',
        appTaskId: 'task-1', // Weight: 37 in app
        subTasks: [
            { id: 'st-1-1', name: 'Drone Scan & Digital Topology Generation', baseHours: 3, parentTaskId: 'task-1' },
            { id: 'st-1-2', name: 'Sun Analysis', baseHours: 1, parentTaskId: 'task-1' },
            { id: 'st-1-3', name: 'Wind Analysis', baseHours: 1, parentTaskId: 'task-1' },
            { id: 'st-1-4', name: 'Rainfall Analysis', baseHours: 1, parentTaskId: 'task-1' },
            { id: 'st-1-5', name: 'Land Evaluation Report', baseHours: 1, parentTaskId: 'task-1' },
        ],
    },
    {
        id: 'group-3',
        name: 'Consultant & Contractors Research',
        appTaskId: 'task-2', // Weight: 6 in app
        subTasks: [
            { id: 'st-2-1', name: 'Consultant & Contractors Research', baseHours: 5, parentTaskId: 'task-2' },
        ],
    },
    {
        id: 'group-4',
        name: 'Design Ideation',
        appTaskId: 'task-3', // Weight: 28 (reduced after moving research sub-tasks)
        subTasks: [
            { id: 'st-3-1', name: 'Preliminary Spatial Function Mapping', baseHours: 3, parentTaskId: 'task-3' },
            { id: 'st-3-2', name: 'Preliminary Layout Sketches', baseHours: 10, parentTaskId: 'task-3' },
            { id: 'st-3-3', name: 'Mood Board Development', baseHours: 2, parentTaskId: 'task-3' },
            { id: 'st-3-4', name: 'Conceptual Design Ideas / AI Renders', baseHours: 8, parentTaskId: 'task-3' },
            { id: 'st-3-5', name: 'Project DNA Presentation', baseHours: 5, parentTaskId: 'task-3' },
        ],
    },
    {
        id: 'group-5',
        name: 'Masterplan Main Task',
        appTaskId: 'task-4', // Weight: 69 in app
        subTasks: [
            { id: 'st-4-1', name: 'Zoning Strategy & Diagrams', baseHours: 5, parentTaskId: 'task-4' },
            { id: 'st-4-2', name: 'Conceptual Rendered Views of Zones', baseHours: 5, parentTaskId: 'task-4' },
            { id: 'st-4-3', name: 'Concept Site Plan (1:1000 scale)', baseHours: 30, parentTaskId: 'task-4' },
            { id: 'st-4-4', name: 'Vaastu Shastra Consultancy', baseHours: 6, parentTaskId: 'task-4' },
            { id: 'st-4-5', name: 'MP Resonance & Bioplanning Ideation', baseHours: 5, parentTaskId: 'task-4' },
            { id: 'st-4-6', name: 'MP Spatial Planning and User Flow', baseHours: 12, parentTaskId: 'task-4' },
        ],
    },
    {
        id: 'group-6',
        name: 'Design Testing & Refinement',
        appTaskId: 'task-5', // Weight: 45 in app
        subTasks: [
            { id: 'st-5-1', name: 'Stage 2 - Meeting Notes', baseHours: 6, parentTaskId: 'task-5' },
            { id: 'st-5-2', name: 'Resonance Tuning', baseHours: 10, parentTaskId: 'task-5' },
            { id: 'st-5-3', name: 'Alternative Design Solutions & Exact Placements', baseHours: 10, parentTaskId: 'task-5' },
            { id: 'st-5-4', name: '2D Schematic Design', baseHours: 5, parentTaskId: 'task-5' },
            { id: 'st-5-5', name: 'Consultant Feedback', baseHours: 2, parentTaskId: 'task-5' },
            { id: 'st-5-6', name: '3D Model Refinement', baseHours: 20, parentTaskId: 'task-5' },
        ],
    },
    {
        id: 'group-7',
        name: 'Visualization',
        appTaskId: 'task-6', // Weight: 51 in app
        subTasks: [
            { id: 'st-6-1', name: 'Video Clips', baseHours: 10, parentTaskId: 'task-6' },
            { id: 'st-6-2', name: '3D Exterior Renders', baseHours: 30, parentTaskId: 'task-6' },
            { id: 'st-6-3', name: 'Virtual Reality & Interactive Presentations', baseHours: 2, parentTaskId: 'task-6' },
            { id: 'st-6-4', name: 'Final Presentation and Handover', baseHours: 2, parentTaskId: 'task-6' },
        ],
    },
    {
        id: 'group-8',
        name: 'Interior Design Main Task',
        appTaskId: 'task-7', // Weight: 65 in app (addon-interiors)
        subTasks: [
            { id: 'st-7-1', name: 'Interior Mood Boards', baseHours: 3, parentTaskId: 'task-7' },
            { id: 'st-7-2', name: 'Interior Concept Renders', baseHours: 30, parentTaskId: 'task-7' },
            { id: 'st-7-3', name: 'FF&E Selections', baseHours: 10, parentTaskId: 'task-7' },
            { id: 'st-7-4', name: 'Interior Sections & Elevations', baseHours: 10, parentTaskId: 'task-7' },
            { id: 'st-7-5', name: 'Materials & Finishes Schedule', baseHours: 6, parentTaskId: 'task-7' },
        ],
    },
];

// Calculate total base hours for a parent task group
export const getGroupBaseHours = (group: ParentTaskGroup): number => {
    return group.subTasks.reduce((sum, st) => sum + st.baseHours, 0);
};

// Get all sub-tasks flattened
export const getAllSubTasks = () => {
    return parentTaskGroups.flatMap(group => group.subTasks);
};
