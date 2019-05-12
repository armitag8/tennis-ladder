import React, { Component } from "react";
import "../style/NavBar.css";

class NavBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: this.props.user
        };
    }

    render() {
        return ! this.props.user ? null :
                <div className="navbar"> 
                    <div className="tab" onClick={() => this.props.changeView("games")}>Games</div>
                    <div className="tab" onClick={() => this.props.changeView("ranking")}>Ranking</div>
                    <div className="tab" onClick={() => this.props.changeView("profile")}>Profile</div>
                    <div className="tab" onClick={this.props.logout}>Logout</div>
                </div>
    }
}

export default NavBar;