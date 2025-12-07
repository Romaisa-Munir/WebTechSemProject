pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
    }
    
    stages {
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
        
        stage('Stop Old Containers') {
            steps {
                echo 'Stopping any existing Jenkins containers...'
                sh '''
                cd ${WORKSPACE}
                docker-compose -f docker-compose-jenkins.yml down || true
                docker rm -f jenkins-bookverse-mongodb jenkins-bookverse-api jenkins-bookverse-web || true
                '''
            }
        }
        
        stage('Build & Deploy') {
            steps {
                echo 'Starting containers with docker-compose...'
                sh '''
                cd ${WORKSPACE}
                docker-compose -f docker-compose-jenkins.yml up -d
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
                
                echo "Waiting for services to stabilize..."
                sleep 10
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
                
                # Update BASE_URL for Jenkins port
                sed -i 's|BASE_URL = "http://13.201.96.168"|BASE_URL = "http://13.201.96.168:8081"|' test_bookverse.py
                
                # Run tests using system Python with venv
                /home/ubuntu/venv/bin/python3 test_bookverse.py
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Verifying containers are running...'
                sh '''
                docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps
                echo "Application accessible at http://13.201.96.168:8081"
                echo "All tests passed successfully!"
                '''
            }
        }
    }
    
    post {
        success {
            echo '✓ Pipeline completed successfully! All tests passed.'
        }
        failure {
            echo '✗ Pipeline failed. Check logs for details.'
            sh '''
            echo "=== Application Logs ==="
            docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml logs --tail=50 || true
            '''
        }
    }
}
