import React from "react";
import { Link } from "react-router-dom";
import Button from "@material-ui/core/Button";

export default function SideBar() {
  return (
    <>
      <div className="side-bar">
        <img
          className="logo"
          src="uoa-med-and-health-sci-logo.png"
          alt="UoA Medical & Health Science Logo"
        />
        <ul className="side-bar-list">
          <li className="list-item">
            <Button
              className="btn white"
              color="default"
              variant="contained"
              component={Link}
              to="/"
            >
              Create
            </Button>
          </li>
        </ul>
      </div>
    </>
  );
}
