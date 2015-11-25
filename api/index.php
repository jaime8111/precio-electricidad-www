<?php header('Access-Control-Allow-Origin: *'); ?>
<?php
    require 'Slim/Slim.php';

    \Slim\Slim::registerAutoloader();
    $app = new \Slim\Slim();

    date_default_timezone_set("Europe/Madrid");

    $app->get('/save/:year/:month/:day',  'savePrices');
    $app->get('/save',  'saveTodayPrices');

    $app->get('/get/:year/:month/:day',  'getPrices');
    $app->get('/get',  'getTodayPrices');

    $app->get('/', function () {
        echo "Esta p&aacute;gina no existe. Es la parte back de la app Precio de Electricidad";
    });

    $app->run();

    function getTodayPrices() {
        //$todayDate = date("Y").date("m").date("d"); //today
        getPrices( date("Y"), date("m"), date("d"));
    }

    function getPrices($year, $month, $day) {
        $dayFormatDate = $year."-".$month."-".$day;

        $sql = "SELECT * FROM precios WHERE priceDate='".$dayFormatDate."'";
        try {
            $db = getConnection();
            $stmt = $db->prepare($sql);

            $stmt->execute();
            $sqlResult = $stmt->fetchObject();
            $allRecords = $stmt->fetchAll(PDO::FETCH_OBJ);

            echo '{"prices": ' . json_encode($allRecords) . ', "currentHour": '.date('G').'}';

            $db = null;
        } catch(PDOException $e) {
            echo '{"error":{"text":'. $e->getMessage() .'}}';
        }
    }

    function saveTodayPrices() {
        $tomorrow = new DateTime('tomorrow');
        savePrices( $tomorrow->format("Y"), $tomorrow->format("m"), $tomorrow->format("d"));
    }

    function savePrices($year, $month, $day) {
        $dayDate = $year.$month.$day; // 20140329
        echo "<h1>Saving prices of: ".$dayDate."</h1>";

        // check if prices of this day is saved are already saved
        $sql = "SELECT id FROM precios WHERE id=".$dayDate."01";
        try {
            $db = getConnection();
            $stmt = $db->prepare($sql);
            $stmt->bindParam("id", $dayDate);
            $stmt->execute();
            $sqlResult = $stmt->fetchObject();

            if ( !$stmt->rowCount() ) {
                echo "<p>Get prices from file & save them in DB</p>";
                // price of this date wasn't save before, so we save it.
                getFiletoDB($dayDate);
            } else {
                echo "<p>This day prices were already saved</p>";
            }
            $db = null;
            //echo json_encode($sqlResult);
        } catch(PDOException $e) {
            echo '{"error":{"text":'. $e->getMessage() .'}}';
        }

    }

    function getFiletoDB($dayDate) {

        $ch = curl_init('http://www.omie.es/datosPub/marginalpdbc/marginalpdbc_'.$dayDate.'.1');

        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

        $fileContent = curl_exec($ch);
        $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ( $http_status == 200 ) {

            // split string for each new line
            $pieces = preg_split("/\\r\\n|\\r|\\n/", $fileContent);

            foreach ($pieces as &$line) {
                // check if line is a price line (it must start with the current year)
                if ( substr($line, 0, 4) == date("Y") ) {
                    $linePieces = explode(";", $line);

                    $hour = $linePieces[3]-1; // ajusto la hora xq ellos la cuenta de 1 a 24 y yo de 0 a 23
                    $twoDigitsHour = $hour; // because i want id in db always have the same amount of digits
                    if ( $twoDigitsHour <= 9 ) {
                        $twoDigitsHour = '0'.$hour;
                    }
                    $id = $dayDate.$twoDigitsHour;

                    // el precio lo recibo en MWh --> lo transformo en kWh y lo salvo con 5 decimales
                    $price = number_format($linePieces[4]/1000,5);
                    $itemDate = $linePieces[0].'-'.$linePieces[1].'-'.$linePieces[2];

                    $db = getConnection();
                    $sql2 = $db->prepare("INSERT INTO precios (id, priceDate, hour, price) VALUES (:id, :priceDate, :hour, :price)");
                        $sql2->bindValue(':id', $id);
                        $sql2->bindValue(':priceDate', $itemDate);
                        $sql2->bindValue(':hour', $hour);
                        $sql2->bindValue(':price', $price);
                    $sql2->execute();
                }
            }
            echo "<p>OK: File saved!</p>";
        } else {
            echo "<p><strong style='color: red'>ERROR: File doesn't exist</strong></p>";
        }

        // close conection with file
        curl_close($ch);
    }

    function getConnection() {

        $dbhost="localhost";
        $dbuser="precio-elec-user";

        // $dbhost = "95.85.47.138";
        // $dbuser="precio-elec2";

        $dbpass="cpNZa6RPTxFY4XtA";
        $dbname="precio_electricidad";
        $dbh = new PDO("mysql:host=$dbhost;dbname=$dbname", $dbuser, $dbpass);
        $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $dbh;
    }

?>