import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;

import java.time.Duration;

public class LoginPage {
    @FindBy(xpath = '//*[@id="app"]/div/div/div/main/div/div/div/div[2]/div[2]/div[1]/table/tbody/tr/td[7]/div/div/div/a')
    WebElement proceduresButton;
    
    @FindBy(xpath= '//*[@id="v-menu-82"]/div/div/div')
    WebElement blockButton;

    @FindBy(id = 'note')
    WebElement noteInput;

    @FindBy(id = 'confirm-dialog-button')
    WebElement confirmButton;

    private WebDriver driver;

    public CustomerPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public void navigateToCustomerPage() {
        driver.get("https://develop.d2kq2y0f7f67al.amplifyapp.com/customers/1272");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.visibilityOf(emailInput));
    }

    public void clickProceduresButton(String query) {
        proceduresButton.click();
    }

    public void clickBlockButton() {
        blockButton.click();
    }

    public void enterNote(String note) {
        noteInput.sendKeys(note);
    }

    public void clickConfirmButton() {
        confirmButton.click();
    }
}