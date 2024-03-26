import { BrowserRouter } from "react-router-dom";
import renderer from "react-test-renderer";
import DashedCard from "../DashedCard";
import TestRenderer from "react-test-renderer";
const { act } = TestRenderer;

let component;
test("Dashed Card component snapshot test", () => {
  act(() => {
    component = renderer.create(
      <BrowserRouter>
        <DashedCard />
      </BrowserRouter>
    );
  });

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
