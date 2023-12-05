from subprocess import call
import argparse
from gevent import monkey

def start_server(ip, port):
	# monkey.patch_all()

	# call(['uwsgi', 
    #       '--http', f'{ip}:{port}',
    #       '--processes', '1',
    #       '--gevent', '1000',
    #       '--http-websockets',         # Enable WebSocket support
    #       '--master',
    #       '--wsgi-file', 'stk_sweep.py',
    #      '--callable', 'app'])

    # geventwebsocket.gunicorn.workers.GeventWebSocketWorker

	call(['gunicorn',
    	'-k', 'geventwebsocket.gunicorn.workers.GeventWebSocketWorker',
    	'-w', '1',
    	'-t', '100',
    	'-b', '0.0.0.0:5000',
    	'webapp:app'])

if __name__ == '__main__':
	print('running')

	parser = argparse.ArgumentParser(description='Start the Flask server with uWSGI.')
	parser.add_argument('--ip', default='localhost', help='The IP address to bind to.')
	parser.add_argument('--port', type=int, default=5000, help='The port to bind to.')
	args = parser.parse_args()

	start_server(args.ip, args.port)
	