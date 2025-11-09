pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
        COMPOSE_FILE = "${WORKSPACE}/docker-compose-jenkins.yml"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Cloning repository from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Romaisa-Munir/WebTechSemProject.git'
            }
        }
        
        stage('Prepare Environment') {
            steps {
                echo 'Copying docker-compose file...'
                sh '''
                    cp /home/ubuntu/jenkins-bookverse/docker-compose-jenkins.yml ${WORKSPACE}/
                '''
            }
        }
        
        stage('Stop Old Containers') {
            steps {
                echo 'Stopping any existing Jenkins containers...'
                sh '''
                    cd ${WORKSPACE}
                    docker-compose -f docker-compose-jenkins.yml down || true
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
                    sleep 10  # Wait for MongoDB to be ready
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection books --file 
/tmp/db_files/BOOKVERSE.books.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection genres --file 
/tmp/db_files/BOOKVERSE.genres.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection users --file 
/tmp/db_files/BOOKVERSE.users.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection wishlists --file 
/tmp/db_files/BOOKVERSE.wishlists.json --jsonArray --drop || true
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Verifying containers are running...'
                sh '''
                    docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps
                    echo "Application should be accessible at http://65.2.129.230:8081"
                '''
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            echo 'Application is running at: http://65.2.129.230:8081'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
            sh 'docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml logs'
        }
    }
}
