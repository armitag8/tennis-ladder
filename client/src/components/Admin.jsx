import React, { Component } from "react";
import config from "../config"
import '../style/Admin.css';
import validator from "validator";
import PlayerLookupBox from "./PlayerLookupBox";
import Button from "./Button";

const blank = {
    action: "Invite Player",
    player: "",
    player2: "",
    position: "",
    games: [],
    week: ""
};

class Admin extends Component {
    constructor(props) {
        super(props);
        this.state = blank;
        this.actions = {
            "Invite Player": this.invitePlayer,
            "Delete Invite": this.deleteInvite,
            "Move Player": this.move,
            "Delete Player": this.deletePlayer,
            "Schedule Match": this.schedule,
            "Delete Match": this.deleteMatch
        }
    }

    deletePlayer = () => fetch(`/api/user/${this.state.player}`, { method: "DELETE" });

    deleteMatch = () =>
        fetch(`/api/games/${this.state.player}/${this.state.player2}/${this.state.week}`,
            { method: "DELETE" });

    deleteInvite = () => fetch(`/api/invite/${this.state.player}`, { method: "DELETE" });

    invitePlayer = () => fetch(`/api/invite/${this.state.player}`, { method: "POST" });

    move = () =>
        fetch(`/api/user/${this.state.player}/position/${this.state.position}`, { method: "PUT" });

    schedule = () =>
        fetch(`/api/games/scheduled/${this.state.player}/${this.state.player2}`, { method: "POST" });

    getGames = () => fetch("/api/games/scheduled/")
        .then(response => response.ok ?
            response.json().then(games => this.setState({ games: games })) :
            this.props.logout()
        ).catch(err => this.props.onError(new Error("Cannot Retrieve games")));

    removeGame = gameID => fetch(`/api/games/${gameID}`, { method: "DELETE" })
        .then(response => response.ok ?
            this.getGames() : this.props.onError(new Error("Cannot delete")))
        .catch(err => this.props.onError(new Error("Cannot delete")));

    componentDidMount = this.getGames;

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState);
    }

    isValid = () => {
        if (!this.state.action)
            this.props.onError(new Error("Invalid action"));
        else if (!validator.isEmail(this.state.player.trim()))
            this.props.onError(new Error("Invalid email"));
        else if (this.state.action === "Move Player" && !validator.isInt(this.state.position))
            this.props.onError(new Error("Invalid position"));
        else if (this.state.action === "Schedule Match" && !validator.isEmail(this.state.player2.trim()))
            this.props.onError(new Error("Invalid email"));
        else if (this.state.action === "Delete Match" && !validator.isInt(this.state.week))
            this.props.onError(new Error("Invalid week"));
        else {
            this.setState(s => ({
                player: s.player.toLowerCase().trim(),
                player2: s.player2.toLowerCase().trim()
            }))
            return true;
        }
    }

    applyAdministration = () => {
        if (!this.isValid()) return;
        this.actions[this.state.action]()
            .then(response =>
                response.ok ? this.setState(blank, this.getGames) :
                    this.props.onError(new Error(response.status + " " + response.statusText)))
            .catch(error => this.props.onError(new Error(error)));
    }

    render() {
        return (
            <div className="view">
                <form className="admin" onSubmit={e => {
                    e.preventDefault();
                    this.applyAdministration();
                }}>
                    <select className="field"
                        name="action"
                        value={this.state.action}
                        placeholder="action"
                        onChange={this.onUpdate}>
                        {Object.keys(this.actions).map(action =>
                            <option key={action} value={action}>{action}</option>)}
                    </select>
                    <PlayerLookupBox
                        inputClass="field"
                        player={this.state.player}
                        onUpdate={this.onUpdate}
                        name="player"
                        onError={this.props.onError}
                    />
                    {this.state.action !== "Move Player" ? null : <input
                        className="field"
                        name="position"
                        value={this.state.position}
                        onChange={this.onUpdate}
                        placeholder="Position"
                        type="number"
                    />}
                    {this.state.action !== "Schedule Match" && this.state.action !== "Delete Match" ?
                        null : <PlayerLookupBox
                            inputClass="field"
                            player={this.state.player2}
                            onUpdate={this.onUpdate}
                            name="player2"
                            onError={this.props.onError}
                        />}
                    {this.state.action !== "Delete Match" ? null : <input
                        className="field week-field"
                        name="week"
                        value={this.state.week}
                        onChange={this.onUpdate}
                        placeholder="Week"
                        type="number"
                        min="0"
                    />}
                    <button className="field" type="submit">Submit</button>
                </form>
                <h2>Upcoming Matches</h2>
                <table>
                    <thead>
                        <tr>
                            <td>Week</td>
                            <td>Player 1</td>
                            <td>Player 2</td>
                            <td>Delete</td>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.games.map(game => <tr key={game._id}>
                            <td>{game.week}</td>
                            <td>{game.player1}</td>
                            <td>{game.player2}</td>
                            <td><Button
                                onClick={() => this.removeGame(game._id)}
                                icon="icono-trash" />
                            </td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default Admin;