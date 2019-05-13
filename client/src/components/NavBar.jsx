import React, { Component } from "react";
import "../style/NavBar.css";
import Button from "./Button";

const toTitleCase = string => string[0].toUpperCase() + string.slice(1);

class NavBar extends Component {
    constructor(props){
        super(props);
        this.state = {nav: false};
    }

    handleKeyPress = event => event.key !== "Escape" ? null : this.setState({nav: false});

    render() {
        return (
            <React.Fragment>
                <div className="navbar">
                    <div className="burger">
                        <Button 
                            icon={this.state.nav ? "icono-cross" : "icono-hamburger"}
                            onClick={() => this.setState(s => ({nav: ! s.nav}))}
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
                                changeView={this.props.changeView}
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
    clickHandler = () => {
        this.props.changeView(this.props.name);
    };

    render() {
        let name = toTitleCase(this.props.name);
        return (
            <div className={this.props.active ? "tab active" : "tab inactive"}
                onClick={this.clickHandler}
            >{name}
            </div>
        );
    }
}

export default NavBar;