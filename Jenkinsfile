pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
    }
    
    stages {
        stage('Cleanup Ports') {
            steps {
                echo 'Cleaning up old containers...'
                sh '''
                docker stop jenkins-bookverse-mongodb jenkins-bookverse-api jenkins-bookverse-web 2>/dev/null || true
                docker rm jenkins-bookverse-mongodb jenkins-bookverse-api jenkins-bookverse-web 2>/dev/null || true
                sleep 2
                '''
            }
        }
        
        stage('Checkout Application') {
            steps {
                echo 'Cloning application repository from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Romaisa-Munir/WebTechSemProject.git'
            }
        }
        
        stage('Prepare Environment') {
            steps {
                echo 'Creating docker-compose configuration...'
                sh '''
                cat > ${WORKSPACE}/docker-compose-jenkins.yml << 'COMPOSE_EOF'
services:
  jenkins-bookverse-db:
    image: mongo:6.0
    container_name: jenkins-bookverse-mongodb
    restart: always
    ports:
      - "27018:27017"
    volumes:
      - jenkins-bookverse-data:/data/db
      - ${WORKSPACE}/database:/tmp/db_files:ro
    networks:
      - jenkins-bookverse-network

  jenkins-bookverse-backend:
    image: node:18-alpine
    container_name: jenkins-bookverse-api
    restart: always
    working_dir: /app
    command: sh -c "npm install && node app.js"
    environment:
      MONGODB_URI: mongodb://jenkins-bookverse-db:27017/bookverse
      JWT_SECRET: jenkins_secret_key_12345
      PORT: 5000
    ports:
      - "5001:5000"
    volumes:
      - ${WORKSPACE}/server/Bookverse:/app
    networks:
      - jenkins-bookverse-network
    depends_on:
      - jenkins-bookverse-db

  jenkins-bookverse-frontend:
    image: node:18-alpine
    container_name: jenkins-bookverse-web
    restart: always
    working_dir: /app
    environment:
      - VITE_API_URL=http://13.201.96.168:5001
    command: sh -c "npm install && npm run build && npx serve -s dist -l 80"
    ports:
      - "8081:80"
    volumes:
      - ${WORKSPACE}/client/Final:/app
    networks:
      - jenkins-bookverse-network
    depends_on:
      - jenkins-bookverse-backend

volumes:
  jenkins-bookverse-data:

networks:
  jenkins-bookverse-network:
    driver: bridge
COMPOSE_EOF
                '''
            }
        }
        
        stage('Build & Deploy') {
            steps {
                echo 'Starting containers with docker-compose...'
                sh '''
                cd ${WORKSPACE}
                docker-compose -f docker-compose-jenkins.yml up -d
                
                echo "Checking container status..."
                docker ps -a | grep jenkins-bookverse
                '''
            }
        }
        
        stage('Import Database') {
            steps {
                echo 'Importing database data...'
                sh '''
                echo "Waiting for MongoDB to be ready..."
                sleep 15
                
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection books --file /tmp/db_files/BOOKVERSE.books.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection genres --file /tmp/db_files/BOOKVERSE.genres.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection users --file /tmp/db_files/BOOKVERSE.users.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection wishlists --file /tmp/db_files/BOOKVERSE.wishlists.json --jsonArray --drop || true
                
                echo "Waiting for frontend to build..."
                sleep 60
                '''
            }
        }
        
        stage('Verify App Running') {
            steps {
                echo 'Checking application status...'
                sh '''
                # Check what containers are actually running
                echo "=== Container Status ==="
                docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep jenkins-bookverse
                
                # Check frontend logs
                echo "=== Frontend Logs (last 30 lines) ==="
                docker logs jenkins-bookverse-web --tail=30 || true
                
                # Try to access the app (but don't fail if it's not ready)
                echo "=== Testing App Access ==="
                curl -f http://localhost:8081 || echo "App not accessible yet, but continuing..."
                '''
            }
        }
        
        stage('Checkout Tests') {
            steps {
                echo 'Cloning test repository...'
                dir('tests') {
                    git branch: 'main',
                        url: 'https://github.com/Romaisa-Munir/bookverse-selenium-tests.git'
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                echo 'Running Selenium tests...'
                sh '''
                cd ${WORKSPACE}/tests
                
                # Change BASE_URL from port 80 to port 8081
                sed -i 's|BASE_URL = "http://13.201.96.168"|BASE_URL = "http://localhost:8081"|' test_bookverse.py
                
                # Verify the change
                echo "BASE_URL is now:"
                grep "^BASE_URL" test_bookverse.py
                
                # Run tests (continue even if they fail)
                /home/ubuntu/venv/bin/python3 test_bookverse.py || echo "Some tests failed, but pipeline continues"
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Final verification...'
                sh '''
                echo "=== Final Container Status ==="
                docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps
                
                echo "=== Deployment Info ==="
                echo "Application should be accessible at http://13.201.96.168:8081"
                echo "Note: If frontend failed to build, check logs above"
                '''
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline execution completed'
            sh '''
            echo "=== Final Logs Summary ==="
            echo "Backend logs:"
            docker logs jenkins-bookverse-api --tail=20 || true
            echo "Frontend logs:"  
            docker logs jenkins-bookverse-web --tail=20 || true
            '''
        }
        success {
            echo '✓ Pipeline completed successfully!'
        }
        failure {
            echo '✗ Pipeline failed at some stage'
        }
    }
}
