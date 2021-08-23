import React from "react";
import { Link } from "react-router-dom";
import Button from "@material-ui/core/Button";

export default function SideBar() {
  return (
    <>
      <div className="top-bar">
        <ul className="top-bar-list">
          <li className="list-item">
            <Button
              className="btn top outlined white"
              color="default"
              variant="outlined"
              component={Link}
              to="/"
            >
              Back
            </Button>
          </li>
        </ul>
      </div>
    </>
  );
}
