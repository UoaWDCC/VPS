# Authoring Tool

## Toolbar

When new components are made the tool bar will need to be updated.
The steps to adding or changing the tool component inside Toolbar is as the following:

1. Update `containers/AuthoringTool/ToolBar/ToolBarData.js` to have the correct icons and titles
   1. No dropdown tool should have **title**, **icon** and a **onClick**
   2. Tool componenets with dropdowns should have **title**, **icon** and a list of objects with a sub dropdown menuItem **[{component: \<SubDropDownItem \/>},{component: \<SubDropDownItem \/>}]**
2. Create a new folder inside `containers/AuthoringTool/ToolBar` to define the onclick functions or the dropdown menu items
3. If this tool component needs a drop down, then you will create the following files corresponding to each dropdown menuItem
   1. a SubMenuItem Component which goes into the `ToolBarData.js`
   2. a component that contains the Modal
   3. a hook that contains the state to manage the opening and closing of the Modal
4. Note that for adding a new tool component or dropdown you should not need to modify the **`containers/AuthoringTool/ToolBar/ToolBar.js`** component. (or at least that's how @lucas2005gao initially designed it to be like)
