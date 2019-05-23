import React, { Component } from 'react';
import config from "../config"
import '../style/Admin.css';
import validator from "validator";
//import NewGameForm from "./NewGameForm";
//import Button from './Button';

const toTitleCase = string => string[0].toUpperCase() + string.slice(1);


class Admin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            action: "invite",
            player: "",
            position: "",
        };
        this.actions = {
            invite: this.invite,
            move: this.move,
            delete: this.delete
        }
    }

    delete = () => fetch(`/api/user/${this.state.player}`, { method: "DELETE" });

    invite = () => fetch(`/api/invite/${this.state.player}`, { method: "POST" });

    move = () =>
        fetch(`/api/user/${this.state.player}/position/${this.state.position}`, { method: "PUT" });

    componentDidMount = () => this.props.user === config.admin ? null : this.props.logout();

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    isValid = () => {
        if (!this.state.action)
            this.props.onError(new Error("Invalid action"));
        else if (!validator.isEmail(this.state.player))
            this.props.onError(new Error("Invalid email"));
        else if (this.state.action === "move" && !validator.isInt(this.state.position))
            this.props.onError(new Error("Invalid position"));
        else
            return true;
    }

    applyAdministration = () => {
        if (!this.isValid()) return;
        this.actions[this.state.action]()
            .then(response =>
                response.ok ? this.setState({ player: "", position: "" }) :
                    this.props.onError(new Error(response.status + " " + response.statusText)))
            .catch(error => this.props.onError(new Error(error)));
    }

    render() {
        return (
            <form className="admin" onSubmit={e => { e.preventDefault(); this.applyAdministration(); }}>
                <select className="field"
                    name="action"
                    value={this.state.action}
                    placeholder="action"
                    onChange={this.onUpdate}>
                    {Object.keys(this.actions).map(action =>
                        <option key={action} value={action}>{toTitleCase(action)}</option>)}
                </select>
                <input className="field"
                    name="player"
                    type="emailfield"
                    value={this.state.player}
                    placeholder="Player"
                    onChange={this.onUpdate}
                />
                {this.state.action !== "move" ? null : <input
                    className="field"
                    name="position"
                    value={this.state.position}
                    onChange={this.onUpdate}
                    placeholder="Position"
                    type="number"
                />}
                <button className="field" type="submit">Submit</button>
            </form>
        );
    }
}

export default Admin;