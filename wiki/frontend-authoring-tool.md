# Authoring Tool

## Toolbar

When new components are made the tool bar will need to be updated.
The steps to adding or changing the tool component inside Toolbar is as the following:

1. Update `containers/pages/AuthoringTool/ToolBar/ToolBarData.js` to have the correct icons and titles
   - All components must be defined with a **title** and **icon**
   - Components without a dropdown menu must have a **onClick** property.
   - Tool components with dropdown menu should have **title**, **icon** and a list of objects with the **dropdown** menu items
     ```
     dropdown: [
        {
           component: \<DropdownMenuItem \/>
        },
        {
           component: \<DropdownMenuItem \/>
        }
     ]
     ```
2. Update `containers/pages/AuthoringTool/ToolBar/ToolBarActions.js` with the **onClick** function required by the component, if applicable.
3. Create a new folder inside `containers/pages/AuthoringTool/ToolBar` to create dropdown menu items, if applicable.
4. If this tool component needs a dropdown menu, then you will have to create the following files corresponding to each menuItem in the dropdown
   - a DropdownMenuItem component which will be used in `ToolBarData.js`
   - For submenu items that open a modal on selection:
     - a component that contains the Modal
   - a hook that contains the state to manage the opening and closing of the Modal
5. Note that when adding a new tool component or dropdown item you should not be modifying the **`containers/AuthoringTool/ToolBar/ToolBar.js`** component. (or at least that's how @lucas2005gao initially designed it to be like)
