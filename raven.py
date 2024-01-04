from webapp import app, socketio, db

with app.app_context():
	db.create_all()

if __name__ == "__main__":
	socketio.run(app, debug=True, host='0.0.0.0')