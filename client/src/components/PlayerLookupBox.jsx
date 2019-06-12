import React, { Component } from 'react';

const toTitleCase = string => (string[0] || "").toUpperCase() + string.slice(1);

class PlayerLookupBox extends Component {
    constructor(props) {
        super(props);
        this.state = {players: []};
    }

    componentDidMount = () => this.updateList("");

    updateList = search => fetch(`/api/user/?search=${search}`)
        .then(response => response.status === 200 ? 
            response.json().then(players => this.setState({ players: players })) :
            this.setState({ players: [] }))
        .catch(err =>  this.props.onError(new Error("Invalid Search")));

    render = () => (
        <React.Fragment>
            <input 
                name={this.props.name}
                list={this.props.name + "List"}
                type="search"
                className={this.props.inputClass}
                value={this.props.player}
                placeholder={toTitleCase(this.props.name)}
                onChange={e => {
                    this.props.onUpdate(e);
                    this.updateList(e.target.value)
                }}
            />
            <datalist id={this.props.name + "List"}>
                {this.state.players.map(p => 
                    <option key={p._id} value={p._id}>{`${p.firstname} ${p.lastname}`}</option>
                )}
            </datalist>
        </React.Fragment>
    );
    
}

export default PlayerLookupBox;