import React, { Component } from "react";
import "../style/NavBar.css";
import Button from "./Button";

const toTitleCase = string => string[0].toUpperCase() + string.slice(1);

class NavBar extends Component {
    constructor(props){
        super(props);
        this.state = {nav: false};
    }

    hideNav = () => this.setState(s => ({nav: ! s.nav}));

    render() {
        return (
            <React.Fragment>
                <div className="navbar">
                    <div className="burger">
                        <Button 
                            icon={this.state.nav ? "icono-cross" : "icono-hamburger"}
                            onClick={this.hideNav}
                        />
                    </div>
                    <div className="title">
                        <h1>{toTitleCase(this.props.view)}</h1>
                    </div>
                </div>
                <div className={this.state.nav ? "sidebar" : "hidden-sidebar"}>
                    <div className="tabs">
                        {this.props.views.map(tab =>
                            <Tab
                                key={tab}
                                name={tab}
                                changeView={name => {
                                    this.hideNav();
                                    this.props.changeView(name);
                                }}
                                active={this.props.view === tab}
                            />
                        )}
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

class Tab extends Component {
    render() {
        let name = toTitleCase(this.props.name);
        return (
            <div className={this.props.active ? "tab active" : "tab inactive"}
                onClick={() => this.props.changeView(this.props.name)}
            >{name}
            </div>
        );
    }
}

export default NavBar;