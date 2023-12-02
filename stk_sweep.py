from waitress import serve
from webapp import app

if __name__ == '__main__':
	serve(app, host='0.0.0.0', port=5000)
	# socketio.run(app, debug=True, host='0.0.0.0')