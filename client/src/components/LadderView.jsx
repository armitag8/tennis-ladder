import React, { Component } from 'react';
import '../style/LadderView.css';
import Button from "./Button";
import NewGameForm from "./NewGameForm";

class LadderView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            _id: "",
            page: 0,
            week: 1,
            players: []
        };
    }

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    updatePlayers = () => 
        fetch("/api/week/" + this.state.week)
        .then(response => {
            if (response.status === 200)
                response.json().then(users => this.setState({ players: users }));
            else if (response.status === 401)
                this.props.logout();
            else 
                console.log(response);
        })
        .catch(console.log);

    componentDidMount = this.updatePlayers;

    render() {
        return (<div>
            {this.state.players.map(player => 
                <PlayerRow
                    user={this.props.user}
                    key={player._id} 
                    _id={player._id}
                    position={player.position}
                    firstname={player.firstname}
                    lastname={player.lastname}
                    wins={player.wins}
                    losses={player.losses}
                />)}
        </div>);
    }
}

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
                        <Button icon={this.state.edit ? "icono-cross" : "icono-sliders"}
                            onClick={() => this.props.user === this.props._id ? null :
                                this.setState(s => ({ edit: ! s.edit }))}
                        />
                        <div className="player-info">
                            <h2>{this.props.position}</h2>
                            <h3>{this.props.firstname} {this.props.lastname}</h3>
                            <div className="stats">Wins: {this.props.wins}</div>
                            <div className="stats">Losses: {this.props.losses}</div>
                        </div>
                        <Button 
                            icon="icono-mail" 
                            onClick={() => window.open("mailto:" + this.props._id)}
                        />
                    </div>
                    {! this.state.edit ? null : 
                        <NewGameForm 
                            user={this.props.user}
                            opponent={this.props._id} 
                            opponentName={this.props.firstname}/>}
                </div>);
    }
}

export default LadderView;