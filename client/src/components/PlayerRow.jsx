import React, { Component } from "react";
import Button from "./Button";
import NewGameForm from "./NewGameForm";

class PlayerRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            edit: false
        };
    }

    render() {
        return (<div className="player-row">
            <div className="row-bar" >
                <Button  
                    loading={this.props.loading}
                    icon={this.state.edit ? "icono-cross" : "icono-sliders"}
                    onClick={() => this.props.user === this.props._id ? null :
                        this.setState(s => ({ edit: !s.edit }))}
                />
                <div className="player-info">
                    <h2>{this.props.position}</h2>
                    <h3 className="player-name">{this.props.firstname} {this.props.lastname}</h3>
                    <div className="stats">Wins: {this.props.wins}</div>
                    <div className="stats">Losses: {this.props.losses}</div>
                </div>
                <Button
                    icon="icono-mail"
                    onClick={() => window.open("mailto:" + this.props._id)}
                />
            </div>
            {!this.state.edit ? null :
                <NewGameForm
                    user={this.props.user}
                    opponent={this.props._id}
                    opponentName={this.props.firstname}
                    onSubmit={() => this.setState({ edit: false }, this.props.updatePlayers)}
                    onError={this.props.onError}
                />}
        </div>);
    }
}

export default PlayerRow;