import React, {Component} from 'react';
import '../style/login-screen.css';
import validator from 'validator';

const OWNER = "UTSC";
const LOCALE = "en-CA";
const LOCALE_NAME = "Canadian";

class LoginScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: "Sign In",
            user: "",
            password: "",
            password2: "",
            phone: "",
            valid: false,
            error: Error("Please input your credentials")
        };
    }

    validate = () => {
        let s = this.state;
        if (! validator.isEmail(s.user))
            this.handleError(Error("Username must be a valid email address."));
        else if (s.password.length < 5) 
            this.handleError(Error("Password must have at least 5 characters"));
        else if (s.mode === 'Sign Up' && s.password !== s.password2)
            this.handleError(Error("Passwords must match"));
        else if (s.mode === "Sign Up" && ! validator.isMobilePhone(s.phone, LOCALE))
            this.handleError(Error("Not a valid " + LOCALE_NAME + " mobile phone number"));
        else
            this.setState({ valid: true });
    }

    handleError = (err) => {
        this.setState({
            valid: false,
            error: err
        });
    }

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    onSubmit = (event) => {
        event.preventDefault();
        if (this.state.valid) {
            fetch(new Request('/api/users/', {
                method: this.state.mode === 'Sign Up' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.state.user,
                    password: this.state.password,
                    phone: this.state.phone
                })
            }))
            .then(response => {
                if (response.ok) this.props.onAuthenticate(this.state.user);
                else response.text().then(msg => this.handleError(new Error(msg)));
            }).catch(err => this.handleError(new Error(err)));
        }
    };
    
    render() {
        return (
            <div className="login has-text-centered">
                <h2 className="title">Welcome to {OWNER}'s Tennis Ladder</h2>
                <form className="login-form">
                    {this.state.valid ? null : <output className="has-text-grey is-size-7">{this.state.error.message}</output>}
                    <div className="inputFields">
                        <input className="field input" placeholder="Email Address" name="user" onChange={this.onUpdate}/>
                        <input className="field input" type="password" placeholder="Password" name="password" onChange={this.onUpdate}/>
                        {this.state.mode === "Sign In" ? null :
                            <React.Fragment>
                                <input className="field input" type="password" placeholder="Retype Password" name="password2" onChange={this.onUpdate}/>
                                <input className="field input" placeholder="Phone Number" name="phone" onChange={this.onUpdate}/>
                            </React.Fragment>
                        }
                    </div>
                    <input 
                        className="loginBtn"
                        type="button" 
                        value={this.state.mode} 
                        onClick={this.onSubmit}
                        disabled={!this.state.valid}
                    />
                    <label className="has-text-centered">{this.state.mode === "Sign In" ? "Need" : "Have"} an account?
                    <input 
                        className="mode"
                        type="button" 
                        name="mode"
                        value={this.state.mode === "Sign In" ? "Sign Up" : "Sign In"}
                        onClick={this.onUpdate} 
                    />
                    </label>
                </form>
            </div>
        );
    }
}

export default LoginScreen;