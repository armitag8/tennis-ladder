import React, {Component} from 'react';
import '../style/Button.css';
import '../style/icono.min.css';

class Button extends Component {
    constructor(props) {
        super(props);
        this.state = {
            angle: 0
        };
    }

    rotate = () => setInterval(() => 
        this.setState(s => ({angle: s.angle + 3}), this.props.loading ? this.rotate : null), 16);
    
    render() {
        return (
            <div>
                <button 
                    className={this.props.loading ? "mode" : "btn"}
                    onClick={() => {
                        this.rotate(); 
                        if (!this.props.loading) this.props.onClick();
                    }
                }>
                    <div
                        className={this.props.loading ? "icono-sync" : this.props.icon}
                        style={this.props.loading ? 
                            { transform: `rotate(${this.state.angle}deg)` } 
                            : {}}
                    />
                </button>
            </div>
        );
    }
}

export default Button;