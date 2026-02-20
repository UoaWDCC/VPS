# Undefined Navigation Bug

## Problem Description

In various stages across the user play process, the application URL resolves to:

- `/play/{scenarioId}/{mode}/undefined`

This causes the application to return an infinite loading screen which the user can’t fix by simply refreshing.

![undefined-bug](./images/undefined_bug.png)

We’ve found that the bug occurs specifically in the following situations, but there could be other edge cases:

- refreshing the invalid-role page at `/play/.../invalid-role`, or subsequently viewing it again
- trying to access a multiplayer scene which the user is not assigned to a group for
- seemingly with random frequency when trying to load a scenario normally

## Logs

This is the only error log I’m seeing on the /undefined page:

```
Warning: Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state.
PlayScenarioPageMulti@http://localhost:3000/static/js/main.chunk.js:16494:31
Route@http://localhost:3000/static/js/vendors~main.chunk.js:257862:29
Switch@http://localhost:3000/static/js/vendors~main.chunk.js:258033:29
PlayScenarioResolver@http://localhost:3000/static/js/main.chunk.js:16771:63
Route@http://localhost:3000/static/js/vendors~main.chunk.js:257862:29
ProtectedRoute@http://localhost:3000/static/js/main.chunk.js:19609:24
Switch@http://localhost:3000/static/js/vendors~main.chunk.js:258033:29
Router@http://localhost:3000/static/js/vendors~main.chunk.js:257544:30
BrowserRouter@http://localhost:3000/static/js/vendors~main.chunk.js:257201:35
AuthenticationContextProvider@http://localhost:3000/static/js/main.chunk.js:18296:39
ThemeProvider@http://localhost:3000/static/js/vendors~main.chunk.js:59016:18
App
```

I did some looking around at other parts of the application to see if there was anything else that could be helpful, and it seems like the same log also occurs in other situations:

- being sent to the invalid-role page for the first time
- being sent to the desync page

However in both of these places the UI still updates successfully.

## Possible Causes

Looking at the log, I'm kind of confused by the message because the code for the PlayScenarioPageMulti component doesn’t have any explicit state updates being called in the main render function body. Instead they are all contained in life cycle functions and useEffect hooks. It also doesn't seem to affect the pages the other 2 times it appears.

One other possible source of the issue is the PlayScenarioResolver component which is responsible for routing to either the singleplayer or multiplayer component. This could also relate to point 2 in the problem description.

Taking a look at the requests sent and received from the backend, they are exactly as expected which indicates that this is a purely frontend issue and not a problem with the scene crawler itself (thankfully).

## Actual Cause

While thinking about the issue some more I noticed a slight flickering effect happening with the url on page refresh where it seems to route to the correct place `/play/.../invalid-role?roles=[...]` but then quickly jumps to /undefined afterwards.

![undefined-bug](./images/undefined_bug.gif)

Which tells me that the problem is most likely not related to the resolver but is definitely related to the way I'm handling URL navigation on the PlayScenarioPage components.

Because the error log is also appearing on the other navigation operations, this means the issue is probably related to the log, and specifically the various history.push() operations being performed.

Specifically this useEffect hook which handles scene navigation:

```
useEffect(() => {
    const onSceneChange = async () => {
      if (sceneId && !previous) return;
      const res = await navigate(user, group._id, previous, sceneId).catch(
        (e) => setError(e?.response)
      );
      if (!sceneId) history.replace(`/play/${scenarioId}/multiplayer/${res}`);
    };
    onSceneChange();
  }, [sceneId]);
```

If you look at this, you might realize that the code isn't correctly setting and handling the error state. 

In the block, the error state is being set within a catch function appended on the promise, but after that there is nothing that stops the onSceneChange function from continuing execution, so it subsequently tries to send us to another location. This is the same route as the /undefined because sceneId is undefined (which is the condition needed for it to happen in this logic). This explains the flickering.

## Primary Solution

The solution to this is to simply stop the execution when the error occurs, which we can do by using a try…catch block instead:

```
  useEffect(() => {
    const onSceneChange = async () => {
      if (sceneId && !previous) return;
      try {
        const res = await navigate(user, group._id, previous, sceneId);
        if (!sceneId) history.replace(`/play/${scenarioId}/multiplayer/${res}`);
      } catch (e) {
        setError(e?.response);
      }
    };
    onSceneChange();
  }, [sceneId]);
```

After testing this, it seems to fix the issue. 

However, the error log is still appearing on this page and the other pages i mentioned, which means that it is referencing something else that probably needs to be fixed as well.

## Other Mitigation

Specifically this conditional block in the main function body where the other history.push() functions are being executed:

```
if (error) {
    if (error.status === 409) {
      history.push(`/play/${scenarioId}/desync`);
    } else if (error.status === 403) {
      const roles = JSON.stringify(error.data.meta.roles_with_access);
      history.push(`/play/${scenarioId}/invalid-role?roles=${roles}`);
    }
    // TODO: create a generic error page and redirect to it
    return <></>;
  }
```

This is updating state with the pushes but then importantly it is also returning some blank html, because it is in the main function body, which is obviously a bad thing and might cause random issues to occur. I didn’t notice this before because I didn’t think about how the history methods were interacting with state, even though it seems obvious now.

To fix this there are two possible solutions:

- return the <Navigate> components provided by react-router-dom which point to the location 
- move the error functionality into a seperate function and remove the error state entirely

I decided to go for the second solution because I thought it would make more sense, especially because the error state essentially becomes useless because we aren’t showing the error UI in this component anyway.

This is the code for the new function:

```
const setError = (error) => {
    if (!error) return;
    if (error.status === 409) {
      history.push(`/play/${scenarioId}/desync`);
    } else if (error.status === 403) {
      const roles = JSON.stringify(error.meta.roles_with_access);
      history.push(`/play/${scenarioId}/invalid-role?roles=${roles}`);
    } else {
      history.push(`/play/${scenarioId}/generic-error`)
    }
  };
```

And now this component doesn’t have an error state at all but should still correctly handle everything.

## Future Considerations

Although this problem seems to be fixed at the moment, I have a suspicion that it isn’t completely fixed because the actually identified problem doesn't seem to explain one of the identified scenarios,

> - trying to access a multiplayer scene which the user is not assigned to a group for

and so this might be part of some other problem probably involving the crawler, because although we now handle the expected errors correctly, the backend shouldn’t be responding with an error for this situation in the first place.

In general though, It would probably be a good idea not to ignore those “warning“ log errors in the future and pay more attention to function execution after state operations.
