import React, { Component } from 'react';
import "../style/ProfileView.css"
import Button from './Button';
import validator from "validator";

const blank = {
    deleteConfirmation: "",
    password: "",
    password2: "",
    firstname: "",
    lastname: "",
    valid: false,
    error: Error(""),
    loading: false,
    user: {}
};

class ProfileView extends Component {
    constructor(props) {
        super(props);
        this.state = blank;
    }
    componentDidMount = () => this.props.user ? this.reload() : this.props.logout();

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    };

    handleError = (err) => {
        this.setState({
            valid: false,
            error: err
        });
    };

    validate = () => {
        let s = this.state;
        if (s.password && s.password.length < 5)
            this.handleError(Error("Password must have at least 5 characters"));
        else if (validator.escape(s.password) !== s.password)
            this.handleError(Error("Password cannot contain: <, >, &, ', \" or /"));
        else if (s.password !== s.password2)
            this.handleError(Error("Passwords must match"));
        else if (s.firstname && s.firstname.length < 1)
            this.handleError(Error("Your first name must be provided"));
        else if (s.firstname && !validator.isAlpha(s.firstname))
            this.handleError(Error("First name may only contain alphabetic characters"));
        else if (s.lastname && !validator.isAlpha(s.lastname))
            this.handleError(Error("Last name may only contain alphabetic characters"));
        else
            this.setState({ valid: true });
    };

    reload = ()  => fetch(`/api/user/${this.props.user}`)
        .then(response => 
            response.json()
                .then(user => this.setState({ user: user }))
                .catch(err => this.props.onError(new Error(err))))
        .catch(this.props.onError);

    updateProfile = () => this.setState({ loading: true }, () => fetch(`/api/user/${this.props.user}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            firstname: this.state.firstname,
            lastname: this.state.lastname,
            password: this.state.password
        })
    }).then(response => response.status === 200 ? this.setState(blank, this.reload) :
        response.text().then(err => this.props.onError(new Error(err)))
    ).catch(this.props.onError));

    deleteProfile = () => this.setState({ loading: true }, () =>
        this.state.deleteConfirmation.toLowerCase().includes("yes") ?
            fetch(`/api/user/${this.props.user}`, { method: "DELETE" })
                .then(response => response.status === 204 ? this.props.logout() :
                    response.text().then(err => this.props.onError(new Error(err)))
                ).catch(this.props.onError) :
            this.props.onError(new Error("Type 'Yes' to confirm.")));

    render() {
        return (
            <div className="view">
                <div className="player-view">
                    <h2>
                        Your Profile
                    </h2>
                    <div className="submit-box">
                        <div>{this.state.user.firstname} {this.state.user.lastname}</div>
                        <div>{this.state.user._id}</div>
                    </div>
                </div>
                
                <form onSubmit={e => e.preventDefault()}>
                    <h2>
                        Delete Your Profile
                    </h2>
                    <div className="submit-box">
                        <input
                            className="field"
                            value={this.state.deleteConfirmation}
                            name="deleteConfirmation"
                            placeholder="Confirm with 'Yes'"
                            onChange={this.onUpdate}
                        />
                        <Button loading={this.state.loading} icon="icono-trash" onClick={this.deleteProfile} />
                    </div>
                </form>
                <form onSubmit={e => e.preventDefault()}>
                    <h2>
                        Edit Your Profile
                    </h2>
                    <div className="submit-box">
                        <div className="fields-box">
                            {this.state.valid ? null : <output>{this.state.error.message}</output>}
                            <input
                                autoComplete="username"
                                value={this.props.user}
                                readOnly
                                hidden
                            >
                            </input>
                            <input
                                className="field"
                                autoComplete="given-name"
                                placeholder="First Name"
                                name="firstname"
                                value={this.state.firstname}
                                onChange={this.onUpdate}
                            />
                            <input
                                className="field"
                                autoComplete="family-name"
                                placeholder="Last Name"
                                value={this.state.lastname}
                                name="lastname"
                                onChange={this.onUpdate}
                            />
                            <input
                                className="field"
                                autoComplete="new-password"
                                type="password"
                                placeholder="Password"
                                name="password"
                                value={this.state.password}
                                onChange={this.onUpdate}
                            />
                            <input
                                className="field"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Retype Password"
                                name="password2"
                                value={this.state.password2}
                                onChange={this.onUpdate}
                            />
                        </div>
                        <Button loading={this.state.loading} icon="icono-check" onClick={this.updateProfile} />
                    </div>
                </form>
            </div>
        );
    }
}

export default ProfileView;